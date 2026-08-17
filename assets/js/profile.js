/**
 * Dynamic profile: header, hero, and about sections.
 */
(function () {
  "use strict";

  const loader = window.SiteLoader;
  if (loader) loader.register("profile");

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

  function renderSkillItem(skill) {
    const level = Math.min(100, Math.max(0, parseInt(skill.level, 10) || 0));
    return (
      '<div class="progress">' +
        '<span class="skill"><span>' + escapeHtml(skill.name) + '</span> <i class="val">' + level + '%</i></span>' +
        '<div class="progress-bar-wrap">' +
          '<div class="progress-bar" role="progressbar" aria-valuenow="' + level + '" aria-valuemin="0" aria-valuemax="100"></div>' +
        "</div>" +
      "</div>"
    );
  }

  function initSkillsAnimation(container) {
    if (!container || typeof Waypoint !== "function") return;
    new Waypoint({
      element: container,
      offset: "80%",
      handler: function () {
        container.querySelectorAll(".progress .progress-bar").forEach(function (el) {
          el.style.width = el.getAttribute("aria-valuenow") + "%";
        });
      }
    });
  }

  function renderSkills(profile) {
    const intro = document.getElementById("skills-intro");
    const container = document.getElementById("skills-content");
    if (!container) return;

    if (intro) intro.textContent = profile.skillsIntro || "";

    const skills = (profile.skills || []).filter(function (s) { return s.name; });
    if (!skills.length) {
      container.innerHTML = '<p class="text-muted text-center mb-0">No skills listed yet.</p>';
      return;
    }

    const midpoint = Math.ceil(skills.length / 2);
    const left = skills.slice(0, midpoint).map(renderSkillItem).join("");
    const right = skills.slice(midpoint).map(renderSkillItem).join("");

    container.innerHTML =
      '<div class="row skills-content skills-animation">' +
        '<div class="col-lg-6">' + left + "</div>" +
        '<div class="col-lg-6">' + right + "</div>" +
      "</div>";

    initSkillsAnimation(container.querySelector(".skills-animation"));
  }

  /** wa.me only accepts digits, so strip spaces, dashes and the leading plus. */
  function toWhatsappDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function formatPhone(value) {
    const digits = toWhatsappDigits(value);
    return digits ? "+" + digits : "";
  }

  function renderWhatsapp(profile) {
    const contact = profile.contact || {};
    const digits = toWhatsappDigits(contact.whatsapp);
    const section = document.getElementById("whatsapp");

    if (!digits) {
      if (section) section.hidden = true;
      document.getElementById("whatsapp-float")?.setAttribute("hidden", "");
      document.getElementById("nav-whatsapp")?.closest("li")?.setAttribute("hidden", "");
      return;
    }

    const href = "https://wa.me/" + digits +
      (contact.whatsappMessage ? "?text=" + encodeURIComponent(contact.whatsappMessage) : "");

    if (section) section.hidden = false;

    const intro = document.getElementById("whatsapp-intro");
    if (intro) intro.textContent = contact.intro || "";

    const number = document.getElementById("whatsapp-number");
    if (number) number.textContent = formatPhone(digits);

    ["whatsapp-button", "whatsapp-float", "nav-whatsapp"].forEach(function (id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.href = href;
      el.removeAttribute("hidden");
      el.closest("li")?.removeAttribute("hidden");
    });

    if (typeof AOS !== "undefined" && AOS.refresh) {
      AOS.refresh();
    }
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
              renderDetail("Phone", d.phone) +
              renderDetail("City", d.city) +
            '</ul></div><div class="col-lg-6"><ul>' +
              renderDetail("Age", d.age) +
              renderDetail("Degree", d.degree) +
              renderDetail("Email", d.email) +
            "</ul></div></div>" +
            '<p class="py-3">' + escapeHtml(profile.aboutText || "") + "</p>" +
          "</div>" +
        "</div>";
    }

    renderSocialLinks(profile.social);
    renderSkills(profile);
    renderWhatsapp(profile);
    initTyped(profile.typedRoles);
  }

  async function loadProfile() {
    try {
      const profile = await PortfolioDataStore.getProfile();
      applyProfile(profile);
    } catch (err) {
      console.error("Profile load error:", err);
    } finally {
      if (loader) loader.done("profile");
    }
  }

  window.addEventListener("load", loadProfile);

  PortfolioDataStore.onDataChange(function (key) {
    if (key === PortfolioDataStore.STORAGE_KEYS.profile) {
      loadProfile();
    }
  });
})();
