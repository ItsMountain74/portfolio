/**
 * Dynamic projects grid for the index page.
 *
 * Renders every published project from the central data source, with category
 * filtering, a "show more" pager, technology tags and action buttons that only
 * appear when the matching URL actually exists.
 */
(function () {
  "use strict";

  const layout = document.querySelector("#projects [data-dynamic-projects]");
  const container = layout && layout.querySelector(".isotope-container");
  if (!container) return;

  const filtersEl = layout.querySelector("#project-filters");
  const pagerEl = layout.querySelector("#project-pager");
  const moreBtn = layout.querySelector("#project-load-more");
  const countEl = layout.querySelector("#project-count");

  const loader = window.SiteLoader;
  if (loader) loader.register("projects");

  const PAGE_SIZE = 9;
  const MOBILE_FILTER = "mobile-apps";

  /** Keeps the filter bar in a deliberate order instead of data order. */
  const CATEGORY_ORDER = [
    "E-Commerce",
    "Marketplace",
    "Transportation",
    "Management Systems",
    "Education",
    "Healthcare",
    "APIs / Backend Systems",
    "Corporate Websites"
  ];

  const PLATFORM_ICONS = {
    android: { icon: "bi-google-play", label: "Android" },
    ios: { icon: "bi-apple", label: "iOS" },
    mobile: { icon: "bi-phone", label: "Mobile app" }
  };

  let projects = [];
  let activeFilter = "*";
  let visibleCount = PAGE_SIZE;

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text == null ? "" : String(text);
    return div.innerHTML;
  }

  function slug(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function isMobile(project) {
    return (project.platforms || []).some(function (p) {
      return /^(android|ios|mobile)$/i.test(p);
    });
  }

  function filtersFor(project) {
    const tokens = [];
    if (project.category) tokens.push(slug(project.category));
    if (isMobile(project)) tokens.push(MOBILE_FILTER);
    return tokens;
  }

  function matches(project, filter) {
    return filter === "*" || filtersFor(project).indexOf(filter) !== -1;
  }

  function platformBadges(project) {
    const seen = {};
    const badges = (project.platforms || []).reduce(function (acc, platform) {
      const key = String(platform).toLowerCase();
      const meta = PLATFORM_ICONS[key];
      if (!meta || seen[key]) return acc;
      seen[key] = true;
      acc.push(
        '<span class="project-platform" title="' + escapeHtml(meta.label) + '">' +
          '<i class="bi ' + meta.icon + '" aria-hidden="true"></i>' +
          '<span class="visually-hidden">' + escapeHtml(meta.label) + "</span>" +
        "</span>"
      );
      return acc;
    }, []);

    if (badges.length === 0) return "";
    return '<span class="project-platforms">' + badges.join("") + "</span>";
  }

  function techTags(project) {
    const tech = project.technologies || [];
    if (tech.length === 0) return "";
    return (
      '<ul class="project-tech">' +
      tech.map(function (item) {
        return "<li>" + escapeHtml(item) + "</li>";
      }).join("") +
      "</ul>"
    );
  }

  /** External links get consistent new-tab safety attributes and a spoken label. */
  function externalLink(href, iconClass, label, ariaLabel, extraClass) {
    return (
      '<a class="project-btn ' + (extraClass || "") + '" href="' + escapeHtml(href) + '"' +
        ' target="_blank" rel="noopener noreferrer"' +
        ' aria-label="' + escapeHtml(ariaLabel) + '">' +
        '<i class="bi ' + iconClass + '" aria-hidden="true"></i>' +
        "<span>" + escapeHtml(label) + "</span>" +
      "</a>"
    );
  }

  function actions(project, detailsUrl) {
    const links = project.links || {};
    const buttons = [
      '<a class="project-btn project-btn-primary" href="' + escapeHtml(detailsUrl) + '"' +
        ' aria-label="View project details for ' + escapeHtml(project.title) + '">' +
        '<i class="bi bi-arrow-right-short" aria-hidden="true"></i><span>Details</span>' +
      "</a>"
    ];

    if (links.website) {
      buttons.push(externalLink(
        links.website, "bi-globe", "Website",
        "Visit the " + project.title + " website (opens in a new tab)"
      ));
    }
    if (links.playStore) {
      buttons.push(externalLink(
        links.playStore, "bi-google-play", "Google Play",
        "Get " + project.title + " on Google Play (opens in a new tab)"
      ));
    }
    if (links.appStore) {
      buttons.push(externalLink(
        links.appStore, "bi-apple", "App Store",
        "Download " + project.title + " on the App Store (opens in a new tab)"
      ));
    }

    return '<div class="project-card-actions">' + buttons.join("") + "</div>";
  }

  function renderCard(project) {
    const thumb = PortfolioDataStore.assetUrl(project.thumbnail);
    const detailsUrl = PortfolioDataStore.pageUrl("project-details.html?id=" + encodeURIComponent(project.id));
    const alt = project.title + " — " + (project.shortDescription || project.category || "project");

    const col = document.createElement("div");
    col.className = "col-lg-4 col-md-6 portfolio-item isotope-item project-item";
    col.setAttribute("data-filters", filtersFor(project).join(" "));

    col.innerHTML =
      '<article class="project-card">' +
        '<a class="project-card-media" href="' + escapeHtml(detailsUrl) + '" tabindex="-1" aria-hidden="true">' +
          '<img src="' + escapeHtml(thumb) + '" alt="' + escapeHtml(alt) + '"' +
            ' width="1000" height="625" loading="lazy" decoding="async">' +
          platformBadges(project) +
        "</a>" +
        '<div class="project-card-body">' +
          (project.category ? '<span class="project-card-category">' + escapeHtml(project.category) + "</span>" : "") +
          '<h3 class="project-card-title">' +
            '<a href="' + escapeHtml(detailsUrl) + '">' + escapeHtml(project.title) + "</a>" +
          "</h3>" +
          '<p class="project-card-text">' + escapeHtml(project.shortDescription) + "</p>" +
          techTags(project) +
        "</div>" +
        actions(project, detailsUrl) +
      "</article>";

    return col;
  }

  function renderFilters() {
    if (!filtersEl) return;

    const counts = {};
    projects.forEach(function (project) {
      filtersFor(project).forEach(function (token) {
        counts[token] = (counts[token] || 0) + 1;
      });
    });

    const categories = [];
    projects.forEach(function (project) {
      if (project.category && categories.indexOf(project.category) === -1) {
        categories.push(project.category);
      }
    });

    categories.sort(function (a, b) {
      const ai = CATEGORY_ORDER.indexOf(a);
      const bi = CATEGORY_ORDER.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });

    const entries = [{ token: "*", label: "All", count: projects.length }];
    if (counts[MOBILE_FILTER]) {
      entries.push({ token: MOBILE_FILTER, label: "Mobile Apps", count: counts[MOBILE_FILTER] });
    }
    categories.forEach(function (category) {
      entries.push({ token: slug(category), label: category, count: counts[slug(category)] || 0 });
    });

    filtersEl.innerHTML = entries.map(function (entry) {
      const active = entry.token === activeFilter;
      return (
        '<li data-filter="' + escapeHtml(entry.token) + '"' +
          ' class="' + (active ? "filter-active" : "") + '"' +
          ' role="button" tabindex="0"' +
          ' aria-pressed="' + (active ? "true" : "false") + '">' +
          escapeHtml(entry.label) +
          '<span class="filter-count">' + entry.count + "</span>" +
        "</li>"
      );
    }).join("");

    filtersEl.hidden = entries.length <= 2;
  }

  function renderGrid() {
    const filtered = projects.filter(function (project) {
      return matches(project, activeFilter);
    });
    const shown = filtered.slice(0, visibleCount);

    container.innerHTML = "";
    shown.forEach(function (project) {
      container.appendChild(renderCard(project));
    });

    if (shown.length === 0) {
      container.innerHTML =
        '<div class="col-12 text-center py-5"><p class="text-muted">No projects in this category yet.</p></div>';
    }

    const remaining = filtered.length - shown.length;
    if (pagerEl) {
      pagerEl.hidden = remaining <= 0;
      if (moreBtn) {
        moreBtn.textContent = "Show more projects (" + remaining + " left)";
      }
    }

    if (countEl) {
      countEl.textContent = shown.length === filtered.length
        ? "Showing all " + filtered.length + " projects"
        : "Showing " + shown.length + " of " + filtered.length + " projects";
    }

    if (typeof AOS !== "undefined") AOS.refresh();
  }

  function setFilter(token) {
    if (token === activeFilter) return;
    activeFilter = token;
    visibleCount = PAGE_SIZE;
    renderFilters();
    renderGrid();
  }

  function bindEvents() {
    filtersEl?.addEventListener("click", function (event) {
      const item = event.target.closest("li[data-filter]");
      if (item) setFilter(item.getAttribute("data-filter"));
    });

    filtersEl?.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      const item = event.target.closest("li[data-filter]");
      if (!item) return;
      event.preventDefault();
      setFilter(item.getAttribute("data-filter"));
    });

    moreBtn?.addEventListener("click", function () {
      visibleCount += PAGE_SIZE;
      renderGrid();
    });
  }

  async function loadProjects() {
    try {
      projects = (await PortfolioDataStore.getProjects()).filter(function (p) {
        return p.published !== false;
      });

      if (projects.length === 0) {
        container.innerHTML =
          '<div class="col-12 text-center py-5"><p class="text-muted">No projects yet. Add them from the admin dashboard.</p></div>';
        if (filtersEl) filtersEl.hidden = true;
        if (pagerEl) pagerEl.hidden = true;
        return;
      }

      renderFilters();
      renderGrid();
    } catch (err) {
      console.error("Projects load error:", err);
      container.innerHTML =
        '<div class="col-12 text-center py-5"><p class="text-danger">Failed to load projects.</p></div>';
    } finally {
      if (loader) loader.done("projects");
    }
  }

  bindEvents();
  window.addEventListener("load", loadProjects);

  PortfolioDataStore.onDataChange(function () {
    visibleCount = PAGE_SIZE;
    loadProjects();
  });
})();
