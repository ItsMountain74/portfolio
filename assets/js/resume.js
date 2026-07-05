/**
 * Dynamic resume file display on homepage.
 */
(function () {
  "use strict";

  const section = document.querySelector("#resume .resume-content");
  if (!section) return;

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
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

  function renderEmpty() {
    section.innerHTML =
      '<div class="text-center py-5">' +
        '<i class="bi bi-file-earmark-person display-4 text-muted"></i>' +
        '<p class="text-muted mt-3 mb-0">Resume will appear here once uploaded from the admin dashboard.</p>' +
      "</div>";
  }

  function renderResume(resume) {
    if (!resume || !resume.fileData) {
      renderEmpty();
      return;
    }

    const isPdf = resume.fileType === "application/pdf" || /\.pdf$/i.test(resume.fileName || "");
    const updated = resume.updatedAt ? '<p class="text-muted small mb-3">Last updated: ' + escapeHtml(formatDate(resume.updatedAt)) + "</p>" : "";

    let viewer = "";
    if (isPdf) {
      viewer =
        '<div class="resume-viewer mb-3">' +
          '<iframe src="' + escapeHtml(resume.fileData) + '" title="Resume preview" loading="lazy"></iframe>' +
        "</div>";
    } else {
      viewer =
        '<div class="resume-file-card mb-3">' +
          '<i class="bi bi-file-earmark-text"></i>' +
          "<div>" +
            "<strong>" + escapeHtml(resume.fileName || "Resume file") + "</strong>" +
            '<p class="text-muted small mb-0">Preview not available for this file type. Use download to open it.</p>' +
          "</div>" +
        "</div>";
    }

    section.innerHTML =
      updated +
      viewer +
      '<div class="text-center">' +
        '<a href="' + escapeHtml(resume.fileData) + '" download="' + escapeHtml(resume.fileName || "resume") + '" class="btn btn-primary">' +
          '<i class="bi bi-download"></i> Download Resume' +
        "</a>" +
      "</div>";
  }

  async function loadResume() {
    try {
      const resume = await PortfolioDataStore.getResume();
      renderResume(resume);
    } catch (err) {
      console.error("Resume load error:", err);
      renderEmpty();
    }
  }

  window.addEventListener("load", loadResume);

  PortfolioDataStore.onDataChange(function () {
    loadResume();
  });
})();
