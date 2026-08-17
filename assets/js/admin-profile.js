/**
 * Admin profile editor
 */
(function () {
  "use strict";

  let profile = null;
  let formProfileImage = "";
  let formHeroBackground = "";

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
  }

  function imgUrl(path) {
    if (!path) return "";
    if (/^data:|^https?:\/\//i.test(path)) return path;
    return PortfolioDataStore.assetUrl(path);
  }

  function renderPreviews() {
    const profilePreview = document.getElementById("profile-image-preview");
    const heroPreview = document.getElementById("hero-bg-preview");
    const image = formProfileImage || profile?.profileImage;
    const hero = formHeroBackground || profile?.heroBackground;

    if (profilePreview) {
      profilePreview.innerHTML = image
        ? '<img src="' + escapeHtml(imgUrl(image)) + '" alt="Profile preview">'
        : '<p class="text-muted small mb-0">No profile image</p>';
    }

    if (heroPreview) {
      heroPreview.innerHTML = hero
        ? '<img src="' + escapeHtml(imgUrl(hero)) + '" alt="Hero preview">'
        : '<p class="text-muted small mb-0">No hero background</p>';
    }
  }

  function createSkillRow(skill) {
    const row = document.createElement("div");
    row.className = "row g-2 align-items-end skill-row";
    row.innerHTML =
      '<div class="col-md-5"><label class="form-label small mb-1">Skill name</label>' +
        '<input type="text" class="form-control form-control-sm skill-name" value="' + escapeHtml(skill?.name || "") + '"></div>' +
      '<div class="col-md-5"><label class="form-label small mb-1">Level (0–100)</label>' +
        '<input type="number" class="form-control form-control-sm skill-level" min="0" max="100" value="' + (skill?.level ?? 50) + '"></div>' +
      '<div class="col-md-2"><button type="button" class="btn btn-outline-danger btn-sm w-100 remove-skill-btn"><i class="bi bi-trash"></i></button></div>';
    row.querySelector(".remove-skill-btn").addEventListener("click", function () {
      row.remove();
    });
    return row;
  }

  function renderSkillsList(skills) {
    const list = document.getElementById("skills-list");
    if (!list) return;
    list.innerHTML = "";
    (skills || []).forEach(function (skill) {
      list.appendChild(createSkillRow(skill));
    });
  }

  function collectSkillsFromForm() {
    const rows = document.querySelectorAll("#skills-list .skill-row");
    const skills = [];
    rows.forEach(function (row) {
      const name = row.querySelector(".skill-name")?.value.trim();
      const level = parseInt(row.querySelector(".skill-level")?.value, 10);
      if (!name) return;
      skills.push({ name: name, level: isNaN(level) ? 0 : Math.min(100, Math.max(0, level)) });
    });
    return skills;
  }

  function fillProfileForm(data) {
    profile = data;
    formProfileImage = data.profileImage || "";
    formHeroBackground = data.heroBackground || "";

    document.getElementById("profile-name").value = data.name || "";
    document.getElementById("profile-title").value = data.title || "";
    document.getElementById("profile-tagline").value = data.tagline || "";
    document.getElementById("profile-typed-roles").value = (data.typedRoles || []).join(", ");
    document.getElementById("profile-about-intro").value = data.aboutIntro || "";
    document.getElementById("profile-about-text").value = data.aboutText || "";

    const d = data.details || {};
    document.getElementById("profile-birthday").value = d.birthday || "";
    document.getElementById("profile-phone").value = d.phone || "";
    document.getElementById("profile-city").value = d.city || "";
    document.getElementById("profile-age").value = d.age || "";
    document.getElementById("profile-degree").value = d.degree || "";
    document.getElementById("profile-email").value = d.email || "";

    document.getElementById("profile-skills-intro").value = data.skillsIntro || "";
    renderSkillsList(data.skills || []);

    const c = data.contact || {};
    document.getElementById("profile-contact-intro").value = c.intro || "";
    document.getElementById("profile-contact-whatsapp").value = c.whatsapp || "";
    document.getElementById("profile-contact-whatsapp-message").value = c.whatsappMessage || "";

    const s = data.social || {};
    document.getElementById("profile-twitter").value = s.twitter || "";
    document.getElementById("profile-facebook").value = s.facebook || "";
    document.getElementById("profile-instagram").value = s.instagram || "";
    document.getElementById("profile-skype").value = s.skype || "";
    document.getElementById("profile-linkedin").value = s.linkedin || "";

    renderPreviews();
  }

  function collectProfileFromForm() {
    return {
      name: document.getElementById("profile-name").value.trim(),
      title: document.getElementById("profile-title").value.trim(),
      tagline: document.getElementById("profile-tagline").value.trim(),
      typedRoles: document.getElementById("profile-typed-roles").value.split(",").map(function (s) { return s.trim(); }).filter(Boolean),
      aboutIntro: document.getElementById("profile-about-intro").value.trim(),
      aboutText: document.getElementById("profile-about-text").value.trim(),
      profileImage: formProfileImage,
      heroBackground: formHeroBackground,
      details: {
        birthday: document.getElementById("profile-birthday").value.trim(),
        phone: document.getElementById("profile-phone").value.trim(),
        city: document.getElementById("profile-city").value.trim(),
        age: document.getElementById("profile-age").value.trim(),
        degree: document.getElementById("profile-degree").value.trim(),
        email: document.getElementById("profile-email").value.trim()
      },
      skillsIntro: document.getElementById("profile-skills-intro").value.trim(),
      skills: collectSkillsFromForm(),
      contact: {
        intro: document.getElementById("profile-contact-intro").value.trim(),
        whatsapp: document.getElementById("profile-contact-whatsapp").value.trim(),
        whatsappMessage: document.getElementById("profile-contact-whatsapp-message").value.trim()
      },
      social: {
        twitter: document.getElementById("profile-twitter").value.trim(),
        facebook: document.getElementById("profile-facebook").value.trim(),
        instagram: document.getElementById("profile-instagram").value.trim(),
        skype: document.getElementById("profile-skype").value.trim(),
        linkedin: document.getElementById("profile-linkedin").value.trim()
      }
    };
  }

  async function loadProfileAdmin() {
    profile = await PortfolioDataStore.getProfile();
    fillProfileForm(profile);
  }

  window.AdminProfile = {
    load: loadProfileAdmin,
    getData: function () { return profile; }
  };

  function init() {
    const form = document.getElementById("profile-form");
    if (!form) return;

    document.getElementById("add-skill-btn")?.addEventListener("click", function () {
      document.getElementById("skills-list")?.appendChild(createSkillRow({ name: "", level: 50 }));
    });

    document.getElementById("profile-image-upload")?.addEventListener("change", async function (e) {
      const file = e.target.files[0];
      if (!file) return;
      try {
        formProfileImage = await PortfolioImages.compressFile(file, "profile");
        renderPreviews();
      } catch {
        alert("Could not process profile image.");
      }
      e.target.value = "";
    });

    document.getElementById("hero-bg-upload")?.addEventListener("change", async function (e) {
      const file = e.target.files[0];
      if (!file) return;
      try {
        formHeroBackground = await PortfolioImages.compressFile(file, "hero");
        renderPreviews();
      } catch {
        alert("Could not process hero background.");
      }
      e.target.value = "";
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      profile = collectProfileFromForm();
      if (!profile.name) {
        alert("Name is required.");
        return;
      }
      if (!PortfolioDataStore.saveProfile(profile)) return;
      alert("Profile saved. Refresh the homepage to see changes (same browser). Export JSON to publish on GitHub.");
    });
  }

  window.addEventListener("load", init);
})();
