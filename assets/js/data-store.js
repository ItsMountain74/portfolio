/**
 * Data store for GitHub Pages static portfolio.
 * Loads JSON from repo, merges with localStorage for admin edits.
 */
const PortfolioDataStore = (function () {
  "use strict";

  const STORAGE_KEYS = {
    projects: "portfolio_projects",
    messages: "portfolio_messages",
    adminSession: "portfolio_admin_session"
  };

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
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeLocal(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async function getProjects(useLocalOverride) {
    const local = readLocal(STORAGE_KEYS.projects);

    if (useLocalOverride && local) {
      return local;
    }

    try {
      return await fetchJson("data/projects.json");
    } catch {
      return local || [];
    }
  }

  function saveProjects(projects) {
    writeLocal(STORAGE_KEYS.projects, projects);
  }

  async function getMessages(useLocalOverride) {
    const local = readLocal(STORAGE_KEYS.messages);
    if (useLocalOverride && local) {
      return local;
    }

    try {
      const remote = await fetchJson("data/messages.json");
      if (!local) {
        return remote;
      }

      const merged = mergeMessages(remote, local);
      return merged;
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
    writeLocal(STORAGE_KEYS.messages, messages);
  }

  async function addMessage(message) {
    const messages = await getMessages(true);
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

  return {
    STORAGE_KEYS: STORAGE_KEYS,
    detectBasePath: detectBasePath,
    resolvePath: resolvePath,
    assetUrl: assetUrl,
    pageUrl: pageUrl,
    getProjects: getProjects,
    saveProjects: saveProjects,
    getMessages: getMessages,
    saveMessages: saveMessages,
    addMessage: addMessage,
    exportJson: exportJson,
    importJsonFile: importJsonFile,
    isAdminLoggedIn: isAdminLoggedIn,
    adminLogin: adminLogin,
    adminLogout: adminLogout,
    generateId: generateId,
    slugify: slugify
  };
})();

if (typeof module !== "undefined") {
  module.exports = PortfolioDataStore;
}
