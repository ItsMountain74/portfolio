/**
 * Dynamic portfolio grid rendering for index page.
 */
(function () {
  "use strict";

  const container = document.querySelector("#portfolio .isotope-container");
  const filtersEl = document.querySelector("#portfolio .portfolio-filters");
  const layoutEl = document.querySelector("#portfolio .isotope-layout");

  if (!container || !filtersEl) return;

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
  }

  function buildFilterClass(category) {
    return "filter-" + PortfolioDataStore.slugify(category || "other");
  }

  function renderFilters(categories) {
    filtersEl.innerHTML = "";

    const allLi = document.createElement("li");
    allLi.setAttribute("data-filter", "*");
    allLi.className = "filter-active";
    allLi.textContent = "All";
    filtersEl.appendChild(allLi);

    categories.forEach(function (cat) {
      const li = document.createElement("li");
      li.setAttribute("data-filter", "." + buildFilterClass(cat.id));
      li.textContent = cat.label;
      filtersEl.appendChild(li);
    });
  }

  function renderProject(project) {
    const filterClass = buildFilterClass(project.category);
    const thumb = PortfolioDataStore.assetUrl(project.thumbnail);
    const detailsUrl = PortfolioDataStore.pageUrl("portfolio-details.html?id=" + encodeURIComponent(project.id));
    const galleryId = "portfolio-gallery-" + project.id;

    const col = document.createElement("div");
    col.className = "col-lg-4 col-md-6 portfolio-item isotope-item " + filterClass;
    col.innerHTML =
      '<div class="portfolio-content h-100">' +
        '<img src="' + escapeHtml(thumb) + '" class="img-fluid" alt="' + escapeHtml(project.title) + '">' +
        '<div class="portfolio-info">' +
          "<h4>" + escapeHtml(project.title) + "</h4>" +
          "<p>" + escapeHtml(project.shortDescription) + "</p>" +
          '<a href="' + escapeHtml(thumb) + '" title="' + escapeHtml(project.title) + '" data-gallery="' + escapeHtml(galleryId) + '" class="glightbox preview-link"><i class="bi bi-zoom-in"></i></a>' +
          '<a href="' + escapeHtml(detailsUrl) + '" title="More Details" class="details-link"><i class="bi bi-link-45deg"></i></a>' +
        "</div>" +
      "</div>";

    return col;
  }

  function initIsotope() {
    if (!layoutEl) return;

    let initIsotopeInstance;
    imagesLoaded(container, function () {
      initIsotopeInstance = new Isotope(container, {
        itemSelector: ".isotope-item",
        layoutMode: "masonry",
        filter: "*",
        sortBy: "original-order"
      });

      filtersEl.querySelectorAll("li").forEach(function (filterBtn) {
        filterBtn.addEventListener("click", function () {
          filtersEl.querySelector(".filter-active")?.classList.remove("filter-active");
          filterBtn.classList.add("filter-active");
          initIsotopeInstance.arrange({ filter: filterBtn.getAttribute("data-filter") });
        });
      });
    });
  }

  function initGlightbox() {
    if (typeof GLightbox === "function") {
      GLightbox({ selector: ".glightbox" });
    }
  }

  async function loadPortfolio() {
    try {
      const projects = (await PortfolioDataStore.getProjects()).filter(function (p) {
        return p.published !== false;
      });

      if (projects.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted">No projects yet. Add them from the admin dashboard.</p></div>';
        return;
      }

      const categoryMap = new Map();
      projects.forEach(function (project) {
        const id = project.category || "other";
        if (!categoryMap.has(id)) {
          categoryMap.set(id, {
            id: id,
            label: project.categoryLabel || id.charAt(0).toUpperCase() + id.slice(1)
          });
        }
      });

      renderFilters(Array.from(categoryMap.values()));
      container.innerHTML = "";
      projects.forEach(function (project) {
        container.appendChild(renderProject(project));
      });

      initIsotope();
      initGlightbox();
    } catch (err) {
      console.error("Portfolio load error:", err);
      container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-danger">Failed to load portfolio projects.</p></div>';
    }
  }

  window.addEventListener("load", loadPortfolio);
})();
