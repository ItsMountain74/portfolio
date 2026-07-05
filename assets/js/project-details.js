/**
 * Dynamic project details page (?id=project-id)
 */
(function () {
  "use strict";

  const section = document.querySelector("#portfolio-details");
  if (!section) return;

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
  }

  function getProjectId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch {
      return dateStr;
    }
  }

  function renderLinks(links) {
    if (!links) return "";

    const items = [];
    if (links.website) {
      items.push('<li><strong>Website</strong>: <a href="' + escapeHtml(links.website) + '" target="_blank" rel="noopener">' + escapeHtml(links.website) + "</a></li>");
    }
    if (links.appStore) {
      items.push('<li><strong>App Store</strong>: <a href="' + escapeHtml(links.appStore) + '" target="_blank" rel="noopener"><i class="bi bi-apple"></i> Download on App Store</a></li>");
    }
    if (links.playStore) {
      items.push('<li><strong>Google Play</strong>: <a href="' + escapeHtml(links.playStore) + '" target="_blank" rel="noopener"><i class="bi bi-google-play"></i> Get it on Google Play</a></li>');
    }
    return items.join("");
  }

  function renderDownloadButtons(links) {
    if (!links) return "";
    const buttons = [];

    if (links.website) {
      buttons.push('<a href="' + escapeHtml(links.website) + '" class="btn btn-primary me-2 mb-2" target="_blank" rel="noopener"><i class="bi bi-globe"></i> Visit Website</a>');
    }
    if (links.appStore) {
      buttons.push('<a href="' + escapeHtml(links.appStore) + '" class="btn btn-dark me-2 mb-2" target="_blank" rel="noopener"><i class="bi bi-apple"></i> App Store</a>');
    }
    if (links.playStore) {
      buttons.push('<a href="' + escapeHtml(links.playStore) + '" class="btn btn-success me-2 mb-2" target="_blank" rel="noopener"><i class="bi bi-google-play"></i> Google Play</a>');
    }

    if (buttons.length === 0) return "";
    return '<div class="project-links mt-3">' + buttons.join("") + "</div>";
  }

  function renderNotFound() {
    section.innerHTML =
      '<div class="container" data-aos="fade-up">' +
        '<div class="text-center py-5">' +
          "<h2>Project not found</h2>" +
          '<p class="text-muted">The project you are looking for does not exist or was removed.</p>' +
          '<a href="' + escapeHtml(PortfolioDataStore.pageUrl("index.html#portfolio")) + '" class="btn btn-primary">Back to Portfolio</a>' +
        "</div>" +
      "</div>";
  }

  function renderProject(project) {
    const screenshots = (project.screenshots && project.screenshots.length)
      ? project.screenshots
      : [project.thumbnail];

    const slides = screenshots.map(function (src) {
      const url = PortfolioDataStore.assetUrl(src);
      return '<div class="swiper-slide"><img src="' + escapeHtml(url) + '" alt="' + escapeHtml(project.title) + '"></div>';
    }).join("");

    document.title = project.title + " - Portfolio";
    const pageTitle = document.querySelector(".page-title h1");
    if (pageTitle) pageTitle.textContent = project.title;

    const breadcrumb = document.querySelector(".page-title .breadcrumbs .current");
    if (breadcrumb) breadcrumb.textContent = project.title;

    section.innerHTML =
      '<div class="container" data-aos="fade-up" data-aos-delay="100">' +
        '<div class="row gy-4">' +
          '<div class="col-lg-8">' +
            '<div class="portfolio-details-slider swiper init-swiper">' +
              '<script type="application/json" class="swiper-config">' +
                JSON.stringify({
                  loop: true,
                  speed: 600,
                  autoplay: { delay: 5000 },
                  slidesPerView: "auto",
                  pagination: { el: ".swiper-pagination", type: "bullets", clickable: true }
                }) +
              "<\/script>" +
              '<div class="swiper-wrapper align-items-center">' + slides + "</div>" +
              '<div class="swiper-pagination"></div>' +
            "</div>" +
          "</div>" +
          '<div class="col-lg-4">' +
            '<div class="portfolio-info" data-aos="fade-up" data-aos-delay="200">' +
              "<h3>Project information</h3>" +
              "<ul>" +
                "<li><strong>Category</strong>: " + escapeHtml(project.categoryLabel || project.category) + "</li>" +
                "<li><strong>Client</strong>: " + escapeHtml(project.client || "—") + "</li>" +
                "<li><strong>Project date</strong>: " + escapeHtml(formatDate(project.projectDate)) + "</li>" +
                renderLinks(project.links) +
              "</ul>" +
              renderDownloadButtons(project.links) +
            "</div>" +
            '<div class="portfolio-description" data-aos="fade-up" data-aos-delay="300">' +
              "<h2>" + escapeHtml(project.title) + "</h2>" +
              "<p>" + escapeHtml(project.description || project.shortDescription) + "</p>" +
            "</div>" +
          "</div>" +
        "</div>" +
      "</div>";

    if (typeof initSwiper === "function") {
      initSwiper();
    } else {
      document.querySelectorAll(".init-swiper").forEach(function (swiperElement) {
        const configEl = swiperElement.querySelector(".swiper-config");
        if (configEl) {
          new Swiper(swiperElement, JSON.parse(configEl.innerHTML.trim()));
        }
      });
    }

    if (typeof AOS !== "undefined") {
      AOS.refresh();
    }
  }

  async function loadProject() {
    const id = getProjectId();
    if (!id) {
      renderNotFound();
      return;
    }

    try {
      const projects = await PortfolioDataStore.getProjects();
      const project = projects.find(function (p) {
        return p.id === id && p.published !== false;
      });

      if (!project) {
        renderNotFound();
        return;
      }

      renderProject(project);
    } catch (err) {
      console.error("Project load error:", err);
      renderNotFound();
    }
  }

  window.addEventListener("load", loadProject);
})();
