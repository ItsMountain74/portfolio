/**
 * Dynamic services section rendering.
 */
(function () {
  "use strict";

  const container = document.querySelector("#services .services-container");
  if (!container) return;

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
  }

  function normalizeIcon(icon) {
    const value = (icon || "bi-briefcase").trim();
    return value.startsWith("bi ") ? value : "bi " + value.replace(/^bi-/, "bi-");
  }

  function renderService(service, index) {
    const delay = 100 + (index % 6) * 100;
    const col = document.createElement("div");
    col.className = "col-lg-4 col-md-6 service-item d-flex";
    col.setAttribute("data-aos", "fade-up");
    col.setAttribute("data-aos-delay", String(delay));
    col.innerHTML =
      '<div class="icon flex-shrink-0"><i class="' + escapeHtml(normalizeIcon(service.icon)) + '"></i></div>' +
      "<div>" +
        '<h4 class="title">' + escapeHtml(service.title) + "</h4>" +
        '<p class="description">' + escapeHtml(service.description) + "</p>" +
      "</div>";
    return col;
  }

  async function loadServices() {
    try {
      const services = (await PortfolioDataStore.getServices()).filter(function (s) {
        return s.published !== false;
      });

      if (services.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-4"><p class="text-muted">No services listed yet.</p></div>';
        return;
      }

      container.innerHTML = "";
      services.forEach(function (service, index) {
        container.appendChild(renderService(service, index));
      });

      if (typeof AOS !== "undefined") {
        AOS.refresh();
      }
    } catch (err) {
      console.error("Services load error:", err);
      container.innerHTML = '<div class="col-12 text-center py-4"><p class="text-danger">Failed to load services.</p></div>';
    }
  }

  window.addEventListener("load", loadServices);
})();
