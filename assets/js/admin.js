/**
 * Admin dashboard logic
 */
(function () {
  "use strict";

  let projects = [];
  let messages = [];
  let editingProjectId = null;

  const loginView = document.getElementById("login-view");
  const dashboardView = document.getElementById("dashboard-view");
  const loginForm = document.getElementById("login-form");
  const logoutBtn = document.getElementById("logout-btn");
  const projectForm = document.getElementById("project-form");
  const projectsTableBody = document.getElementById("projects-table-body");
  const messagesList = document.getElementById("messages-list");
  const statProjects = document.getElementById("stat-projects");
  const statMessages = document.getElementById("stat-messages");
  const statUnread = document.getElementById("stat-unread");

  function showView(loggedIn) {
    if (loggedIn) {
      loginView.classList.add("d-none");
      dashboardView.classList.remove("d-none");
    } else {
      loginView.classList.remove("d-none");
      dashboardView.classList.add("d-none");
    }
  }

  function showPanel(panelId) {
    document.querySelectorAll(".admin-panel").forEach(function (panel) {
      panel.classList.toggle("active", panel.id === panelId);
    });
    document.querySelectorAll(".admin-sidebar nav a[data-panel]").forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("data-panel") === panelId);
    });
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  }

  async function refreshData() {
    projects = await PortfolioDataStore.getProjects(true);
    messages = await PortfolioDataStore.getMessages(true);
    renderStats();
    renderProjectsTable();
    renderMessages();
  }

  function renderStats() {
    if (statProjects) statProjects.textContent = projects.length;
    if (statMessages) statMessages.textContent = messages.length;
    if (statUnread) {
      statUnread.textContent = messages.filter(function (m) { return !m.read; }).length;
    }
  }

  function renderProjectsTable() {
    if (!projectsTableBody) return;

    if (projects.length === 0) {
      projectsTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No projects yet.</td></tr>';
      return;
    }

    projectsTableBody.innerHTML = projects.map(function (project) {
      const thumb = PortfolioDataStore.assetUrl(project.thumbnail);
      return (
        "<tr>" +
          '<td><img class="thumb" src="' + escapeHtml(thumb) + '" alt=""></td>' +
          "<td><strong>" + escapeHtml(project.title) + "</strong><br><small class=\"text-muted\">" + escapeHtml(project.id) + "</small></td>" +
          "<td>" + escapeHtml(project.categoryLabel || project.category) + "</td>" +
          "<td>" + (project.published !== false ? '<span class="badge bg-success">Published</span>' : '<span class="badge bg-secondary">Draft</span>') + "</td>" +
          '<td class="text-nowrap">' +
            '<button class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="' + escapeHtml(project.id) + '"><i class="bi bi-pencil"></i></button>' +
            '<button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="' + escapeHtml(project.id) + '"><i class="bi bi-trash"></i></button>' +
          "</td>" +
        "</tr>"
      );
    }).join("");
  }

  function renderMessages() {
    if (!messagesList) return;

    if (messages.length === 0) {
      messagesList.innerHTML = '<p class="text-muted mb-0">No contact messages yet.</p>';
      return;
    }

    messagesList.innerHTML = messages.map(function (msg) {
      return (
        '<div class="message-item ' + (msg.read ? "" : "unread") + '" data-id="' + escapeHtml(msg.id) + '">' +
          '<div class="d-flex justify-content-between align-items-start flex-wrap gap-2">' +
            "<div>" +
              "<strong>" + escapeHtml(msg.name) + "</strong> &lt;" + escapeHtml(msg.email) + "&gt;" +
              '<div class="meta">' + escapeHtml(formatDate(msg.createdAt)) + "</div>" +
            "</div>" +
            '<div class="text-nowrap">' +
              (msg.read ? "" : '<button class="btn btn-sm btn-outline-primary me-1" data-action="read"><i class="bi bi-check2"></i> Mark read</button>') +
              '<button class="btn btn-sm btn-outline-danger" data-action="delete"><i class="bi bi-trash"></i></button>' +
            "</div>" +
          "</div>" +
          "<p class=\"mb-1\"><strong>Subject:</strong> " + escapeHtml(msg.subject) + "</p>" +
          "<p class=\"mb-0\">" + escapeHtml(msg.body) + "</p>" +
        "</div>"
      );
    }).join("");
  }

  function resetProjectForm() {
    editingProjectId = null;
    projectForm.reset();
    document.getElementById("project-id").value = "";
    document.getElementById("project-published").checked = true;
    document.getElementById("form-title").textContent = "Add Project";
    document.getElementById("screenshots-preview").innerHTML = "";
  }

  function fillProjectForm(project) {
    editingProjectId = project.id;
    document.getElementById("project-id").value = project.id;
    document.getElementById("project-title").value = project.title || "";
    document.getElementById("project-category").value = project.category || "";
    document.getElementById("project-category-label").value = project.categoryLabel || "";
    document.getElementById("project-short-desc").value = project.shortDescription || "";
    document.getElementById("project-desc").value = project.description || "";
    document.getElementById("project-thumbnail").value = project.thumbnail || "";
    document.getElementById("project-screenshots").value = (project.screenshots || []).join("\n");
    document.getElementById("project-website").value = project.links?.website || "";
    document.getElementById("project-appstore").value = project.links?.appStore || "";
    document.getElementById("project-playstore").value = project.links?.playStore || "";
    document.getElementById("project-client").value = project.client || "";
    document.getElementById("project-date").value = project.projectDate || "";
    document.getElementById("project-published").checked = project.published !== false;
    document.getElementById("form-title").textContent = "Edit Project";
    updateScreenshotPreview();
  }

  function updateScreenshotPreview() {
    const preview = document.getElementById("screenshots-preview");
    const lines = document.getElementById("project-screenshots").value.split("\n").filter(Boolean);
    preview.innerHTML = lines.map(function (line) {
      const url = PortfolioDataStore.assetUrl(line.trim());
      return '<img src="' + escapeHtml(url) + '" alt="">';
    }).join("");
  }

  function collectProjectFromForm() {
    const title = document.getElementById("project-title").value.trim();
    const id = document.getElementById("project-id").value.trim() || PortfolioDataStore.generateId(title);
    const screenshots = document.getElementById("project-screenshots").value
      .split("\n")
      .map(function (s) { return s.trim(); })
      .filter(Boolean);

    return {
      id: id,
      title: title,
      category: document.getElementById("project-category").value.trim() || "other",
      categoryLabel: document.getElementById("project-category-label").value.trim() || "Other",
      shortDescription: document.getElementById("project-short-desc").value.trim(),
      description: document.getElementById("project-desc").value.trim(),
      thumbnail: document.getElementById("project-thumbnail").value.trim(),
      screenshots: screenshots,
      links: {
        website: document.getElementById("project-website").value.trim(),
        appStore: document.getElementById("project-appstore").value.trim(),
        playStore: document.getElementById("project-playstore").value.trim()
      },
      client: document.getElementById("project-client").value.trim(),
      projectDate: document.getElementById("project-date").value,
      published: document.getElementById("project-published").checked
    };
  }

  function init() {
    if (PortfolioDataStore.isAdminLoggedIn()) {
      showView(true);
      refreshData();
    } else {
      showView(false);
    }

    loginForm?.addEventListener("submit", function (e) {
      e.preventDefault();
      const password = document.getElementById("admin-password").value;
      if (PortfolioDataStore.adminLogin(password)) {
        showView(true);
        refreshData();
      } else {
        document.getElementById("login-error").textContent = "Invalid password.";
        document.getElementById("login-error").classList.remove("d-none");
      }
    });

    logoutBtn?.addEventListener("click", function () {
      PortfolioDataStore.adminLogout();
      showView(false);
    });

    document.querySelectorAll(".admin-sidebar nav a[data-panel]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        showPanel(link.getAttribute("data-panel"));
      });
    });

    projectForm?.addEventListener("submit", function (e) {
      e.preventDefault();
      const project = collectProjectFromForm();

      if (!project.title || !project.thumbnail) {
        alert("Title and thumbnail are required.");
        return;
      }

      const index = projects.findIndex(function (p) { return p.id === project.id; });
      if (index >= 0) {
        projects[index] = project;
      } else if (editingProjectId) {
        const editIndex = projects.findIndex(function (p) { return p.id === editingProjectId; });
        if (editIndex >= 0) projects[editIndex] = project;
        else projects.push(project);
      } else {
        projects.push(project);
      }

      PortfolioDataStore.saveProjects(projects);
      resetProjectForm();
      refreshData();
      showPanel("panel-projects");
    });

    document.getElementById("cancel-edit")?.addEventListener("click", resetProjectForm);
    document.getElementById("project-screenshots")?.addEventListener("input", updateScreenshotPreview);
    document.getElementById("project-thumbnail")?.addEventListener("input", updateScreenshotPreview);

    projectsTableBody?.addEventListener("click", function (e) {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      const project = projects.find(function (p) { return p.id === id; });

      if (btn.getAttribute("data-action") === "edit" && project) {
        fillProjectForm(project);
        showPanel("panel-add-project");
      }

      if (btn.getAttribute("data-action") === "delete" && confirm("Delete this project?")) {
        projects = projects.filter(function (p) { return p.id !== id; });
        PortfolioDataStore.saveProjects(projects);
        refreshData();
      }
    });

    messagesList?.addEventListener("click", function (e) {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const item = btn.closest(".message-item");
      const id = item.getAttribute("data-id");

      if (btn.getAttribute("data-action") === "read") {
        messages = messages.map(function (m) {
          return m.id === id ? Object.assign({}, m, { read: true }) : m;
        });
        PortfolioDataStore.saveMessages(messages);
        refreshData();
      }

      if (btn.getAttribute("data-action") === "delete" && confirm("Delete this message?")) {
        messages = messages.filter(function (m) { return m.id !== id; });
        PortfolioDataStore.saveMessages(messages);
        refreshData();
      }
    });

    document.getElementById("export-projects")?.addEventListener("click", function () {
      PortfolioDataStore.exportJson("projects.json", projects);
    });

    document.getElementById("export-messages")?.addEventListener("click", function () {
      PortfolioDataStore.exportJson("messages.json", messages);
    });

    document.getElementById("import-projects")?.addEventListener("change", async function (e) {
      const file = e.target.files[0];
      if (!file) return;
      try {
        projects = await PortfolioDataStore.importJsonFile(file);
        PortfolioDataStore.saveProjects(projects);
        refreshData();
        alert("Projects imported successfully.");
      } catch {
        alert("Invalid JSON file.");
      }
      e.target.value = "";
    });

    document.getElementById("import-messages")?.addEventListener("change", async function (e) {
      const file = e.target.files[0];
      if (!file) return;
      try {
        messages = await PortfolioDataStore.importJsonFile(file);
        PortfolioDataStore.saveMessages(messages);
        refreshData();
        alert("Messages imported successfully.");
      } catch {
        alert("Invalid JSON file.");
      }
      e.target.value = "";
    });

    document.getElementById("clear-local-data")?.addEventListener("click", function () {
      if (confirm("Clear all local admin data? This will reload from data/*.json files.")) {
        localStorage.removeItem(PortfolioDataStore.STORAGE_KEYS.projects);
        localStorage.removeItem(PortfolioDataStore.STORAGE_KEYS.messages);
        refreshData();
      }
    });

    document.getElementById("goto-add-project")?.addEventListener("click", function () {
      showPanel("panel-add-project");
    });

    document.getElementById("view-site")?.setAttribute("href", PortfolioDataStore.pageUrl("index.html"));
  }

  window.addEventListener("load", init);
})();
