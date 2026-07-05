/**
 * Dynamic profile: header, hero, and about sections.
 */
(function () {
  "use strict";

  let typedInstance = null;

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
  }

  function imgUrl(path) {
    return PortfolioDataStore.assetUrl(path || "");
  }

  function renderDetail(label, value) {
    if (!value) return "";
    return "<li><i class=\"bi bi-chevron-right\"></i> <strong>" + escapeHtml(label) + ":</strong> <span>" + escapeHtml(value) + "</span></li>";
  }

  function renderSocialLinks(social) {
    const wrap = document.querySelector("#header .social-links");
    if (!wrap || !social) return;

    const links = [
      { key: "twitter", icon: "bi-twitter-x", class: "twitter" },
      { key: "facebook", icon: "bi-facebook", class: "facebook" },
      { key: "instagram", icon: "bi-instagram", class: "instagram" },
      { key: "skype", icon: "bi-skype", class: "google-plus" },
      { key: "linkedin", icon: "bi-linkedin", class: "linkedin" }
    ];

    wrap.innerHTML = links.map(function (item) {
      const url = social[item.key];
      if (!url) return "";
      return '<a href="' + escapeHtml(url) + '" class="' + item.class + '" target="_blank" rel="noopener"><i class="bi ' + item.icon + '"></i></a>';
    }).filter(Boolean).join("");
  }

  function initTyped(roles) {
    const el = document.querySelector(".typed");
    if (!el || typeof Typed !== "function") return;

    const strings = (roles && roles.length) ? roles : ["Developer"];
    el.setAttribute("data-typed-items", strings.join(","));

    if (typedInstance && typedInstance.destroy) {
      typedInstance.destroy();
    }

    typedInstance = new Typed(".typed", {
      strings: strings,
      loop: true,
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000
    });
  }

  function applyProfile(profile) {
    if (!profile) return;

    const name = profile.name || "Portfolio";
    document.querySelectorAll(".sitename").forEach(function (el) {
      el.textContent = name;
    });
    document.title = name + " - Portfolio";

    const profileImg = imgUrl(profile.profileImage);
    document.querySelectorAll(".profile-img img, #about-profile-image").forEach(function (img) {
      if (profileImg) {
        img.src = profileImg;
        img.alt = name;
      }
    });

    const heroBg = document.getElementById("hero-bg");
    if (heroBg && profile.heroBackground) {
      heroBg.src = imgUrl(profile.heroBackground);
    }

    const heroName = document.getElementById("hero-name");
    if (heroName) heroName.textContent = name;

    const aboutIntro = document.getElementById("about-intro");
    if (aboutIntro) aboutIntro.textContent = profile.aboutIntro || "";

    const aboutContent = document.getElementById("about-content");
    if (aboutContent) {
      const d = profile.details || {};
      aboutContent.innerHTML =
        '<div class="row gy-4 justify-content-center">' +
          '<div class="col-lg-4">' +
            '<img id="about-profile-image" src="' + escapeHtml(profileImg) + '" class="img-fluid" alt="' + escapeHtml(name) + '">' +
          "</div>" +
          '<div class="col-lg-8 content">' +
            "<h2>" + escapeHtml(profile.title || "") + "</h2>" +
            '<p class="fst-italic py-3">' + escapeHtml(profile.tagline || "") + "</p>" +
            '<div class="row"><div class="col-lg-6"><ul>' +
              renderDetail("Birthday", d.birthday) +
              renderDetail("Website", d.website) +
              renderDetail("Phone", d.phone) +
              renderDetail("City", d.city) +
            '</ul></div><div class="col-lg-6"><ul>' +
              renderDetail("Age", d.age) +
              renderDetail("Degree", d.degree) +
              renderDetail("Email", d.email) +
              renderDetail("Freelance", d.freelance) +
            "</ul></div></div>" +
            '<p class="py-3">' + escapeHtml(profile.aboutText || "") + "</p>" +
          "</div>" +
        "</div>";
    }

    renderSocialLinks(profile.social);
    initTyped(profile.typedRoles);
  }

  async function loadProfile() {
    try {
      const profile = await PortfolioDataStore.getProfile();
      applyProfile(profile);
    } catch (err) {
      console.error("Profile load error:", err);
    }
  }

  window.addEventListener("load", loadProfile);

  PortfolioDataStore.onDataChange(function (key) {
    if (key === PortfolioDataStore.STORAGE_KEYS.profile) {
      loadProfile();
    }
  });
})();
