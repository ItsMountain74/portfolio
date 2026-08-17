/**
 * Dynamic project details page (?id=project-id)
 */
(function () {
  "use strict";

  const section = document.querySelector("#portfolio-details");
  if (!section) return;

  const loader = window.SiteLoader;
  if (loader) loader.register("project-details");

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

  /** Only renders a row when there is something real to show. */
  function infoRow(label, value) {
    if (!value) return "";
    return "<li><strong>" + escapeHtml(label) + "</strong>: " + escapeHtml(value) + "</li>";
  }

  function renderDownloadButtons(project) {
    const links = project.links || {};
    const buttons = [];
    const title = project.title || "this project";

    if (links.website) {
      buttons.push(
        '<a href="' + escapeHtml(links.website) + '" class="btn btn-primary me-2 mb-2" target="_blank" rel="noopener noreferrer"' +
        ' aria-label="Visit the ' + escapeHtml(title) + ' website (opens in a new tab)">' +
        '<i class="bi bi-globe" aria-hidden="true"></i> Visit Website</a>'
      );
    }
    if (links.playStore) {
      buttons.push(
        '<a href="' + escapeHtml(links.playStore) + '" class="btn btn-success me-2 mb-2" target="_blank" rel="noopener noreferrer"' +
        ' aria-label="Get ' + escapeHtml(title) + ' on Google Play (opens in a new tab)">' +
        '<i class="bi bi-google-play" aria-hidden="true"></i> Google Play</a>'
      );
    }
    if (links.appStore) {
      buttons.push(
        '<a href="' + escapeHtml(links.appStore) + '" class="btn btn-dark me-2 mb-2" target="_blank" rel="noopener noreferrer"' +
        ' aria-label="Download ' + escapeHtml(title) + ' on the App Store (opens in a new tab)">' +
        '<i class="bi bi-apple" aria-hidden="true"></i> App Store</a>'
      );
    }

    if (buttons.length === 0) {
      return '<p class="project-no-links">This project is not publicly available to browse.</p>';
    }
    return '<div class="project-links mt-3">' + buttons.join("") + "</div>";
  }

  function renderTagList(title, items) {
    if (!items || items.length === 0) return "";
    return (
      '<div class="portfolio-detail-block">' +
        "<h3>" + escapeHtml(title) + "</h3>" +
        '<ul class="portfolio-tags">' +
          items.map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") +
        "</ul>" +
      "</div>"
    );
  }

  function renderTextBlock(title, text) {
    if (!text) return "";
    return (
      '<div class="portfolio-detail-block">' +
        "<h3>" + escapeHtml(title) + "</h3>" +
        "<p>" + escapeHtml(text) + "</p>" +
      "</div>"
    );
  }

  function renderNotFound() {
    section.innerHTML =
      '<div class="container" data-aos="fade-up">' +
        '<div class="text-center py-5">' +
          "<h2>Project not found</h2>" +
          '<p class="text-muted">The project you are looking for does not exist or was removed.</p>' +
          '<a href="' + escapeHtml(PortfolioDataStore.pageUrl("index.html#projects")) + '" class="btn btn-primary">Back to Projects</a>' +
        "</div>" +
      "</div>";
  }

  function renderProject(project) {
    const screenshots = (project.screenshots && project.screenshots.length)
      ? project.screenshots
      : [project.thumbnail].filter(Boolean);

    const alt = project.title + " — " + (project.shortDescription || project.category || "project");

    // A one-image project does not need a carousel; render it as a plain figure.
    const media = screenshots.length > 1
      ? '<div class="portfolio-details-slider swiper init-swiper">' +
          '<script type="application/json" class="swiper-config">' +
            JSON.stringify({
              loop: true,
              speed: 600,
              autoplay: { delay: 5000 },
              slidesPerView: "auto",
              pagination: { el: ".swiper-pagination", type: "bullets", clickable: true }
            }) +
          "<\/script>" +
          '<div class="swiper-wrapper align-items-center">' +
            screenshots.map(function (src) {
              return '<div class="swiper-slide"><img src="' + escapeHtml(PortfolioDataStore.assetUrl(src)) +
                '" alt="' + escapeHtml(alt) + '"></div>';
            }).join("") +
          "</div>" +
          '<div class="swiper-pagination"></div>' +
        "</div>"
      : '<figure class="portfolio-details-figure">' +
          '<img src="' + escapeHtml(PortfolioDataStore.assetUrl(screenshots[0] || "")) +
            '" alt="' + escapeHtml(alt) + '" width="1000" height="625" decoding="async">' +
        "</figure>";

    document.title = project.title + " - Portfolio";
    const pageTitle = document.querySelector(".page-title h1");
    if (pageTitle) pageTitle.textContent = project.title;

    const breadcrumb = document.querySelector(".page-title .breadcrumbs .current");
    if (breadcrumb) breadcrumb.textContent = project.title;

    const platforms = (project.platforms || []).join(", ");

    section.innerHTML =
      '<div class="container" data-aos="fade-up" data-aos-delay="100">' +
        '<div class="row gy-4">' +
          '<div class="col-lg-8">' +
            media +
            '<div class="portfolio-description" data-aos="fade-up" data-aos-delay="200">' +
              "<h2>" + escapeHtml(project.title) + "</h2>" +
              "<p>" + escapeHtml(project.description || project.shortDescription) + "</p>" +
              renderTextBlock("My contribution", project.contribution) +
              renderTagList("Technologies", project.technologies) +
            "</div>" +
          "</div>" +
          '<div class="col-lg-4">' +
            '<div class="portfolio-info" data-aos="fade-up" data-aos-delay="200">' +
              "<h3>Project information</h3>" +
              "<ul>" +
                infoRow("Category", project.category) +
                infoRow("Platforms", platforms) +
                infoRow("Company", project.company) +
                infoRow("Client", project.client) +
                (project.projectDate ? infoRow("Project date", formatDate(project.projectDate)) : "") +
              "</ul>" +
              renderDownloadButtons(project) +
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
    try {
      const id = getProjectId();
      if (!id) {
        renderNotFound();
        return;
      }

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
    } finally {
      if (loader) loader.done("project-details");
    }
  }

  window.addEventListener("load", loadProject);
})();
