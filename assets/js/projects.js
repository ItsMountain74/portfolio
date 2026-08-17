/**
 * Dynamic projects grid rendering for index page.
 */
(function () {
  "use strict";

  const container = document.querySelector("#projects .isotope-container");
  const layoutEl = document.querySelector("#projects .isotope-layout");

  if (!container) return;

  const loader = window.SiteLoader;
  if (loader) loader.register("projects");

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
  }

  function renderProject(project) {
    const thumb = PortfolioDataStore.assetUrl(project.thumbnail);
    const detailsUrl = PortfolioDataStore.pageUrl("project-details.html?id=" + encodeURIComponent(project.id));

    const col = document.createElement("div");
    col.className = "col-lg-4 col-md-6 portfolio-item isotope-item";
    col.innerHTML =
      '<div class="portfolio-content h-100">' +
        '<img src="' + escapeHtml(thumb) + '" class="img-fluid" alt="' + escapeHtml(project.title) + '">' +
        '<div class="portfolio-info">' +
          "<h4>" + escapeHtml(project.title) + "</h4>" +
          "<p>" + escapeHtml(project.shortDescription) + "</p>" +
          '<a href="' + escapeHtml(detailsUrl) + '" title="More Details" class="details-link"><i class="bi bi-link-45deg"></i></a>' +
        "</div>" +
      "</div>";

    return col;
  }

  function initIsotope() {
    if (!layoutEl || typeof Isotope !== "function") return;

    imagesLoaded(container, function () {
      new Isotope(container, {
        itemSelector: ".isotope-item",
        layoutMode: "masonry",
        sortBy: "original-order"
      });
    });
  }

  async function loadProjects() {
    try {
      const projects = (await PortfolioDataStore.getProjects()).filter(function (p) {
        return p.published !== false;
      });

      if (projects.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted">No projects yet. Add them from the admin dashboard.</p></div>';
        return;
      }

      container.innerHTML = "";
      projects.forEach(function (project) {
        container.appendChild(renderProject(project));
      });

      initIsotope();
    } catch (err) {
      console.error("Projects load error:", err);
      container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-danger">Failed to load projects.</p></div>';
    } finally {
      if (loader) loader.done("projects");
    }
  }

  window.addEventListener("load", loadProjects);

  PortfolioDataStore.onDataChange(function () {
    loadProjects();
  });
})();
