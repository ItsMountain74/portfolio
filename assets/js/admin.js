/**
 * Admin dashboard logic
 */
(function () {
  "use strict";

  let projects = [];
  let services = [];
  let messages = [];
  let resume = { fileName: "", fileType: "", fileData: "", updatedAt: "" };
  let pendingResumeFile = null;
  let editingProjectId = null;
  let editingServiceId = null;
  let formThumbnail = "";
  let formScreenshots = [];

  const loginView = document.getElementById("login-view");
  const dashboardView = document.getElementById("dashboard-view");
  const loginForm = document.getElementById("login-form");
  const logoutBtn = document.getElementById("logout-btn");
  const projectForm = document.getElementById("project-form");
  const projectsTableBody = document.getElementById("projects-table-body");
  const messagesList = document.getElementById("messages-list");
  const statProjects = document.getElementById("stat-projects");
  const statServices = document.getElementById("stat-services");
  const statMessages = document.getElementById("stat-messages");
  const statUnread = document.getElementById("stat-unread");
  const servicesTableBody = document.getElementById("services-table-body");
  const resumePreview = document.getElementById("resume-preview");
  const serviceForm = document.getElementById("service-form");
  const thumbnailPreview = document.getElementById("thumbnail-preview");
  const screenshotsPreview = document.getElementById("screenshots-preview");

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

  function imageSrc(value) {
    if (!value) return "";
    if (/^data:|^https?:\/\//i.test(value)) {
      return value;
    }
    return PortfolioDataStore.assetUrl(value);
  }

  function compressImage(file, maxWidth) {
    maxWidth = maxWidth || 1400;
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
          const quality = mime === "image/jpeg" ? 0.85 : undefined;
          resolve(canvas.toDataURL(mime, quality));
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleImageFiles(files, mode) {
    const list = Array.from(files || []).filter(function (file) {
      return file.type.startsWith("image/");
    });

    if (list.length === 0) {
      return;
    }

    for (const file of list) {
      try {
        const dataUrl = await compressImage(file);
        if (mode === "thumbnail") {
          formThumbnail = dataUrl;
        } else {
          formScreenshots.push(dataUrl);
        }
      } catch {
        alert("Could not process image: " + file.name);
      }
    }

    renderImagePreviews();
  }

  function renderThumbnailPreview() {
    if (!thumbnailPreview) return;
    if (!formThumbnail) {
      thumbnailPreview.innerHTML = '<p class="text-muted small mb-0">No thumbnail uploaded yet.</p>';
      return;
    }
    thumbnailPreview.innerHTML =
      '<div class="upload-preview-item">' +
        '<img src="' + escapeHtml(formThumbnail) + '" alt="Thumbnail preview">' +
        '<button type="button" class="btn btn-sm btn-outline-danger" data-action="remove-thumbnail"><i class="bi bi-trash"></i> Remove</button>' +
      "</div>";
  }

  function renderScreenshotsPreview() {
    if (!screenshotsPreview) return;
    if (formScreenshots.length === 0) {
      screenshotsPreview.innerHTML = '<p class="text-muted small mb-0">No screenshots uploaded yet.</p>';
      return;
    }
    screenshotsPreview.innerHTML = formScreenshots.map(function (src, index) {
      return (
        '<div class="upload-preview-item" data-index="' + index + '">' +
          '<img src="' + escapeHtml(src) + '" alt="Screenshot ' + (index + 1) + '">' +
          '<button type="button" class="btn btn-sm btn-outline-danger" data-action="remove-screenshot" data-index="' + index + '"><i class="bi bi-trash"></i></button>' +
        "</div>"
      );
    }).join("");
  }

  function renderImagePreviews() {
    renderThumbnailPreview();
    renderScreenshotsPreview();
  }

  async function refreshData() {
    projects = await PortfolioDataStore.getProjects();
    services = await PortfolioDataStore.getServices();
    messages = await PortfolioDataStore.getMessages();
    resume = await PortfolioDataStore.getResume();
    renderStats();
    renderProjectsTable();
    renderServicesTable();
    renderMessages();
    renderResumePreview();
  }

  function renderStats() {
    if (statProjects) statProjects.textContent = projects.length;
    if (statServices) statServices.textContent = services.length;
    if (statMessages) statMessages.textContent = messages.length;
    if (statUnread) {
      statUnread.textContent = messages.filter(function (m) { return !m.read; }).length;
    }
  }

  function renderProjectsTable() {
    if (!projectsTableBody) return;

    if (projects.length === 0) {
      projectsTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No projects yet.</td></tr>';
      return;
    }

    projectsTableBody.innerHTML = projects.map(function (project) {
      const thumb = imageSrc(project.thumbnail);
      return (
        "<tr>" +
          '<td><img class="thumb" src="' + escapeHtml(thumb) + '" alt=""></td>' +
          "<td><strong>" + escapeHtml(project.title) + "</strong><br><small class=\"text-muted\">" + escapeHtml(project.id) + "</small></td>" +
          "<td>" + (project.published !== false ? '<span class="badge bg-success">Published</span>' : '<span class="badge bg-secondary">Draft</span>') + "</td>" +
          '<td class="text-nowrap">' +
            '<button class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="' + escapeHtml(project.id) + '"><i class="bi bi-pencil"></i></button>' +
            '<button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="' + escapeHtml(project.id) + '"><i class="bi bi-trash"></i></button>' +
          "</td>" +
        "</tr>"
      );
    }).join("");
  }

  function normalizeIcon(icon) {
    const value = (icon || "bi-briefcase").trim();
    return value.startsWith("bi ") ? value : "bi " + value.replace(/^bi-/, "bi-");
  }

  function renderServicesTable() {
    if (!servicesTableBody) return;

    if (services.length === 0) {
      servicesTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No services yet.</td></tr>';
      return;
    }

    servicesTableBody.innerHTML = services.map(function (service) {
      return (
        "<tr>" +
          '<td><i class="' + escapeHtml(normalizeIcon(service.icon)) + ' fs-4"></i></td>' +
          "<td><strong>" + escapeHtml(service.title) + "</strong><br><small class=\"text-muted\">" + escapeHtml(service.id) + "</small></td>" +
          "<td>" + (service.published !== false ? '<span class="badge bg-success">Published</span>' : '<span class="badge bg-secondary">Draft</span>') + "</td>" +
          '<td class="text-nowrap">' +
            '<button class="btn btn-sm btn-outline-primary me-1" data-action="edit-service" data-id="' + escapeHtml(service.id) + '"><i class="bi bi-pencil"></i></button>' +
            '<button class="btn btn-sm btn-outline-danger" data-action="delete-service" data-id="' + escapeHtml(service.id) + '"><i class="bi bi-trash"></i></button>' +
          "</td>" +
        "</tr>"
      );
    }).join("");
  }

  function renderResumePreview() {
    if (!resumePreview) return;

    const data = pendingResumeFile || resume;
    if (!data || !data.fileData) {
      resumePreview.innerHTML = '<p class="text-muted small mb-0">No resume uploaded yet.</p>';
      return;
    }

    const isPdf = data.fileType === "application/pdf" || /\.pdf$/i.test(data.fileName || "");
    const meta = '<p class="small mb-2"><strong>' + escapeHtml(data.fileName || "Resume") + "</strong></p>";

    if (isPdf) {
      resumePreview.innerHTML = meta + '<iframe src="' + escapeHtml(data.fileData) + '" title="Resume preview"></iframe>';
      return;
    }

    resumePreview.innerHTML =
      meta +
      '<div class="resume-preview-card">' +
        '<i class="bi bi-file-earmark-text fs-2"></i>' +
        "<div><p class=\"mb-2\">Preview not available for this file type.</p>" +
        '<a href="' + escapeHtml(data.fileData) + '" download="' + escapeHtml(data.fileName || "resume") + '" class="btn btn-sm btn-outline-primary"><i class="bi bi-download"></i> Download to review</a>' +
        "</div></div>";
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function (event) { resolve(event.target.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function resetServiceForm() {
    editingServiceId = null;
    serviceForm?.reset();
    document.getElementById("service-id").value = "";
    document.getElementById("service-icon").value = "bi-briefcase";
    document.getElementById("service-published").checked = true;
    document.getElementById("service-form-title").textContent = "Add Service";
  }

  function fillServiceForm(service) {
    editingServiceId = service.id;
    document.getElementById("service-id").value = service.id;
    document.getElementById("service-title").value = service.title || "";
    document.getElementById("service-icon").value = (service.icon || "bi-briefcase").replace(/^bi\s/, "");
    document.getElementById("service-description").value = service.description || "";
    document.getElementById("service-published").checked = service.published !== false;
    document.getElementById("service-form-title").textContent = "Edit Service";
  }

  function collectServiceFromForm() {
    const title = document.getElementById("service-title").value.trim();
    const id = document.getElementById("service-id").value.trim() || PortfolioDataStore.generateId(title);
    return {
      id: id,
      title: title,
      description: document.getElementById("service-description").value.trim(),
      icon: document.getElementById("service-icon").value.trim() || "bi-briefcase",
      published: document.getElementById("service-published").checked
    };
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
    formThumbnail = "";
    formScreenshots = [];
    projectForm.reset();
    document.getElementById("project-id").value = "";
    document.getElementById("project-published").checked = true;
    document.getElementById("form-title").textContent = "Add Project";
    document.getElementById("project-thumbnail-upload").value = "";
    document.getElementById("project-screenshots-upload").value = "";
    renderImagePreviews();
  }

  function fillProjectForm(project) {
    editingProjectId = project.id;
    document.getElementById("project-id").value = project.id;
    document.getElementById("project-title").value = project.title || "";
    document.getElementById("project-short-desc").value = project.shortDescription || "";
    document.getElementById("project-desc").value = project.description || "";
    document.getElementById("project-website").value = project.links?.website || "";
    document.getElementById("project-appstore").value = project.links?.appStore || "";
    document.getElementById("project-playstore").value = project.links?.playStore || "";
    document.getElementById("project-client").value = project.client || "";
    document.getElementById("project-date").value = project.projectDate || "";
    document.getElementById("project-published").checked = project.published !== false;
    document.getElementById("form-title").textContent = "Edit Project";
    formThumbnail = project.thumbnail || "";
    formScreenshots = Array.isArray(project.screenshots) ? project.screenshots.slice() : [];
    document.getElementById("project-thumbnail-upload").value = "";
    document.getElementById("project-screenshots-upload").value = "";
    renderImagePreviews();
  }

  function collectProjectFromForm() {
    const title = document.getElementById("project-title").value.trim();
    const id = document.getElementById("project-id").value.trim() || PortfolioDataStore.generateId(title);

    return {
      id: id,
      title: title,
      shortDescription: document.getElementById("project-short-desc").value.trim(),
      description: document.getElementById("project-desc").value.trim(),
      thumbnail: formThumbnail,
      screenshots: formScreenshots.slice(),
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

    document.getElementById("project-thumbnail-upload")?.addEventListener("change", function (e) {
      handleImageFiles(e.target.files, "thumbnail");
      e.target.value = "";
    });

    document.getElementById("project-screenshots-upload")?.addEventListener("change", function (e) {
      handleImageFiles(e.target.files, "screenshots");
      e.target.value = "";
    });

    thumbnailPreview?.addEventListener("click", function (e) {
      const btn = e.target.closest('[data-action="remove-thumbnail"]');
      if (!btn) return;
      formThumbnail = "";
      renderImagePreviews();
    });

    screenshotsPreview?.addEventListener("click", function (e) {
      const btn = e.target.closest('[data-action="remove-screenshot"]');
      if (!btn) return;
      const index = parseInt(btn.getAttribute("data-index"), 10);
      formScreenshots.splice(index, 1);
      renderImagePreviews();
    });

    projectForm?.addEventListener("submit", function (e) {
      e.preventDefault();
      const project = collectProjectFromForm();

      if (!project.title || !project.thumbnail) {
        alert("Title and thumbnail image are required.");
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
      alert("Project saved. Refresh the homepage to see changes (same browser). Export JSON to publish on GitHub.");
    });

    document.getElementById("cancel-edit")?.addEventListener("click", resetProjectForm);

    serviceForm?.addEventListener("submit", function (e) {
      e.preventDefault();
      const service = collectServiceFromForm();
      if (!service.title || !service.description) {
        alert("Title and description are required.");
        return;
      }

      const index = services.findIndex(function (s) { return s.id === service.id; });
      if (index >= 0) {
        services[index] = service;
      } else if (editingServiceId) {
        const editIndex = services.findIndex(function (s) { return s.id === editingServiceId; });
        if (editIndex >= 0) services[editIndex] = service;
        else services.push(service);
      } else {
        services.push(service);
      }

      PortfolioDataStore.saveServices(services);
      resetServiceForm();
      refreshData();
      showPanel("panel-services");
      alert("Service saved. Refresh the homepage to see changes (same browser). Export JSON to publish on GitHub.");
    });

    document.getElementById("cancel-service-edit")?.addEventListener("click", resetServiceForm);

    document.getElementById("goto-add-service")?.addEventListener("click", function () {
      resetServiceForm();
      showPanel("panel-add-service");
    });

    servicesTableBody?.addEventListener("click", function (e) {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      const service = services.find(function (s) { return s.id === id; });

      if (btn.getAttribute("data-action") === "edit-service" && service) {
        fillServiceForm(service);
        showPanel("panel-add-service");
      }

      if (btn.getAttribute("data-action") === "delete-service" && confirm("Delete this service?")) {
        services = services.filter(function (s) { return s.id !== id; });
        PortfolioDataStore.saveServices(services);
        refreshData();
      }
    });

    document.getElementById("resume-upload")?.addEventListener("change", async function (e) {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) {
        alert("Resume file must be under 8 MB.");
        e.target.value = "";
        return;
      }
      try {
        pendingResumeFile = {
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileData: await readFileAsDataUrl(file),
          updatedAt: new Date().toISOString()
        };
        resume = pendingResumeFile;
        pendingResumeFile = null;
        if (!PortfolioDataStore.saveResume(resume)) {
          alert("Could not save resume — file may be too large for browser storage.");
          return;
        }
        renderResumePreview();
        alert("Resume saved. Open the homepage in this browser to preview it.");
      } catch {
        alert("Could not read resume file.");
      }
      e.target.value = "";
    });

    document.getElementById("save-resume")?.addEventListener("click", function () {
      if (!pendingResumeFile && !resume.fileData) {
        alert("Upload a resume file first.");
        return;
      }
      if (pendingResumeFile) {
        resume = pendingResumeFile;
        pendingResumeFile = null;
      }
      PortfolioDataStore.saveResume(resume);
      refreshData();
      alert("Resume saved.");
    });

    document.getElementById("remove-resume")?.addEventListener("click", function () {
      if (!confirm("Remove the current resume?")) return;
      resume = { fileName: "", fileType: "", fileData: "", updatedAt: "" };
      pendingResumeFile = null;
      PortfolioDataStore.saveResume(resume);
      document.getElementById("resume-upload").value = "";
      renderResumePreview();
    });

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

    document.getElementById("export-services")?.addEventListener("click", function () {
      PortfolioDataStore.exportJson("services.json", services);
    });

    document.getElementById("export-resume")?.addEventListener("click", function () {
      PortfolioDataStore.exportJson("resume.json", resume);
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

    document.getElementById("import-services")?.addEventListener("change", async function (e) {
      const file = e.target.files[0];
      if (!file) return;
      try {
        services = await PortfolioDataStore.importJsonFile(file);
        PortfolioDataStore.saveServices(services);
        refreshData();
        alert("Services imported successfully.");
      } catch {
        alert("Invalid JSON file.");
      }
      e.target.value = "";
    });

    document.getElementById("import-resume")?.addEventListener("change", async function (e) {
      const file = e.target.files[0];
      if (!file) return;
      try {
        resume = await PortfolioDataStore.importJsonFile(file);
        pendingResumeFile = null;
        PortfolioDataStore.saveResume(resume);
        refreshData();
        alert("Resume imported successfully.");
      } catch {
        alert("Invalid JSON file.");
      }
      e.target.value = "";
    });

    document.getElementById("clear-local-data")?.addEventListener("click", function () {
      if (confirm("Clear all local admin data? This will reload from data/*.json files.")) {
        localStorage.removeItem(PortfolioDataStore.STORAGE_KEYS.projects);
        localStorage.removeItem(PortfolioDataStore.STORAGE_KEYS.messages);
        localStorage.removeItem(PortfolioDataStore.STORAGE_KEYS.services);
        localStorage.removeItem(PortfolioDataStore.STORAGE_KEYS.resume);
        pendingResumeFile = null;
        refreshData();
      }
    });

    document.getElementById("goto-add-project")?.addEventListener("click", function () {
      showPanel("panel-add-project");
    });

    document.getElementById("view-site")?.setAttribute("href", PortfolioDataStore.pageUrl("index.html"));
    renderImagePreviews();
  }

  window.addEventListener("load", init);
})();
