/**
 * Data store for GitHub Pages static portfolio.
 * Admin saves to localStorage; the public site reads localStorage first (same browser),
 * then falls back to data/*.json files from the repo.
 */
const PortfolioDataStore = (function () {
  "use strict";

  const STORAGE_KEYS = {
    projects: "portfolio_projects",
    messages: "portfolio_messages",
    services: "portfolio_services",
    resume: "portfolio_resume",
    adminSession: "portfolio_admin_session"
  };

  const EMPTY_RESUME = { fileName: "", fileType: "", fileData: "", updatedAt: "" };

  function getConfig() {
    return window.PORTFOLIO_CONFIG || {};
  }

  function detectBasePath() {
    const config = getConfig();
    if (config.basePath !== undefined && config.basePath !== "") {
      const bp = config.basePath.replace(/\/?$/, "/");
      return bp.startsWith("/") ? bp : "/" + bp;
    }

    const path = window.location.pathname;
    let segments = path.split("/").filter(Boolean);

    const adminIndex = segments.indexOf("admin");
    if (adminIndex !== -1) {
      segments = segments.slice(0, adminIndex);
    } else {
      const last = segments[segments.length - 1];
      if (last && last.endsWith(".html")) {
        segments.pop();
      }
    }

    if (segments.length === 0) {
      return "/";
    }

    return "/" + segments.join("/") + "/";
  }

  function resolvePath(relativePath) {
    const base = detectBasePath();
    const clean = relativePath.replace(/^\//, "");
    if (base === "/") {
      return clean;
    }
    return base.replace(/\/$/, "") + "/" + clean;
  }

  function assetUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path) || path.startsWith("data:")) {
      return path;
    }
    const resolved = resolvePath(path);
    return resolved.startsWith("/") ? resolved : "/" + resolved;
  }

  function pageUrl(page) {
    return resolvePath(page);
  }

  async function fetchJson(relativePath) {
    const url = resolvePath(relativePath);
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load " + relativePath);
    }
    return response.json();
  }

  function readLocal(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function writeLocal(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (err) {
      console.error("localStorage save failed:", err);
      if (err && err.name === "QuotaExceededError") {
        alert("Storage is full. Export your JSON files and use smaller images, or clear old data from the admin panel.");
      }
      return false;
    }
  }

  async function getProjects() {
    const local = readLocal(STORAGE_KEYS.projects);
    if (local !== null) {
      return local;
    }

    try {
      return await fetchJson("data/projects.json");
    } catch {
      return [];
    }
  }

  function saveProjects(projects) {
    return writeLocal(STORAGE_KEYS.projects, projects);
  }

  async function getServices() {
    const local = readLocal(STORAGE_KEYS.services);
    if (local !== null) {
      return local;
    }

    try {
      return await fetchJson("data/services.json");
    } catch {
      return [];
    }
  }

  function saveServices(services) {
    return writeLocal(STORAGE_KEYS.services, services);
  }

  async function getResume() {
    const local = readLocal(STORAGE_KEYS.resume);
    if (local && local.fileData) {
      return local;
    }

    try {
      const remote = await fetchJson("data/resume.json");
      if (remote && remote.fileData) {
        return remote;
      }
    } catch {
      /* fall through */
    }

    return local || EMPTY_RESUME;
  }

  function saveResume(resume) {
    return writeLocal(STORAGE_KEYS.resume, resume);
  }

  async function getMessages() {
    const local = readLocal(STORAGE_KEYS.messages);

    try {
      const remote = await fetchJson("data/messages.json");
      if (local !== null) {
        return mergeMessages(remote, local);
      }
      return remote;
    } catch {
      return local || [];
    }
  }

  function mergeMessages(remote, local) {
    const ids = new Set();
    const result = [];

    [...remote, ...local].forEach(function (msg) {
      if (!msg.id || ids.has(msg.id)) return;
      ids.add(msg.id);
      result.push(msg);
    });

    return result.sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  function saveMessages(messages) {
    return writeLocal(STORAGE_KEYS.messages, messages);
  }

  async function addMessage(message) {
    const messages = await getMessages();
    const entry = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      name: message.name,
      email: message.email,
      subject: message.subject,
      body: message.message,
      createdAt: new Date().toISOString(),
      read: false
    };
    messages.unshift(entry);
    saveMessages(messages);
    return entry;
  }

  function exportJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function importJsonFile(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        try {
          resolve(JSON.parse(reader.result));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function isAdminLoggedIn() {
    return sessionStorage.getItem(STORAGE_KEYS.adminSession) === "true";
  }

  function adminLogin(password) {
    const expected = getConfig().adminPassword || "admin123";
    if (password === expected) {
      sessionStorage.setItem(STORAGE_KEYS.adminSession, "true");
      return true;
    }
    return false;
  }

  function adminLogout() {
    sessionStorage.removeItem(STORAGE_KEYS.adminSession);
  }

  function slugify(text) {
    return String(text)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function generateId(title) {
    return slugify(title) + "-" + Date.now().toString(36);
  }

  function onDataChange(callback) {
    window.addEventListener("storage", function (event) {
      if (!event.key || !event.key.startsWith("portfolio_")) return;
      callback(event.key);
    });
  }

  return {
    STORAGE_KEYS: STORAGE_KEYS,
    detectBasePath: detectBasePath,
    resolvePath: resolvePath,
    assetUrl: assetUrl,
    pageUrl: pageUrl,
    getProjects: getProjects,
    saveProjects: saveProjects,
    getServices: getServices,
    saveServices: saveServices,
    getResume: getResume,
    saveResume: saveResume,
    getMessages: getMessages,
    saveMessages: saveMessages,
    addMessage: addMessage,
    exportJson: exportJson,
    importJsonFile: importJsonFile,
    isAdminLoggedIn: isAdminLoggedIn,
    adminLogin: adminLogin,
    adminLogout: adminLogout,
    generateId: generateId,
    slugify: slugify,
    onDataChange: onDataChange
  };
})();

if (typeof module !== "undefined") {
  module.exports = PortfolioDataStore;
}
