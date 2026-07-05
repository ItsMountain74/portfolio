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

  function compressImage(file, maxWidth) {
    maxWidth = maxWidth || 1200;
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
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
          resolve(canvas.toDataURL(mime, mime === "image/jpeg" ? 0.85 : undefined));
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
    document.getElementById("profile-website").value = d.website || "";
    document.getElementById("profile-phone").value = d.phone || "";
    document.getElementById("profile-city").value = d.city || "";
    document.getElementById("profile-age").value = d.age || "";
    document.getElementById("profile-degree").value = d.degree || "";
    document.getElementById("profile-email").value = d.email || "";
    document.getElementById("profile-freelance").value = d.freelance || "";

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
        website: document.getElementById("profile-website").value.trim(),
        phone: document.getElementById("profile-phone").value.trim(),
        city: document.getElementById("profile-city").value.trim(),
        age: document.getElementById("profile-age").value.trim(),
        degree: document.getElementById("profile-degree").value.trim(),
        email: document.getElementById("profile-email").value.trim(),
        freelance: document.getElementById("profile-freelance").value.trim()
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

    document.getElementById("profile-image-upload")?.addEventListener("change", async function (e) {
      const file = e.target.files[0];
      if (!file) return;
      try {
        formProfileImage = await compressImage(file);
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
        formHeroBackground = await compressImage(file, 1600);
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
