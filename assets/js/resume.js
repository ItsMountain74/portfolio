/**
 * Dynamic resume display on homepage.
 *
 * Mobile browsers refuse to render PDFs inside an iframe, so pages are drawn
 * to canvases with PDF.js when it is available. The iframe/link fallbacks keep
 * the section usable if PDF.js fails to load.
 */
(function () {
  "use strict";

  const section = document.querySelector("#resume .resume-content");
  if (!section) return;

  const loader = window.SiteLoader;
  if (loader) loader.register("resume");

  const PDFJS_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const RENDER_WIDTH = 1200;
  const MAX_PAGES = 15;

  let objectUrls = [];

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

  function releaseObjectUrls() {
    objectUrls.forEach(URL.revokeObjectURL);
    objectUrls = [];
  }

  function trackObjectUrl(url) {
    objectUrls.push(url);
    return url;
  }

  /** Data URLs are unreliable for downloads and new tabs on mobile; blobs are not. */
  function dataUrlToBlob(dataUrl) {
    const match = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(dataUrl || "");
    if (!match) return null;

    const mime = match[1] || "application/octet-stream";
    const isBase64 = Boolean(match[2]);
    const payload = match[3];

    try {
      if (!isBase64) {
        return new Blob([decodeURIComponent(payload)], { type: mime });
      }
      const binary = atob(payload);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: mime });
    } catch (err) {
      console.error("Could not decode resume file:", err);
      return null;
    }
  }

  function renderActions(fileUrl, fileName) {
    return (
      '<div class="resume-actions">' +
        '<a href="' + escapeHtml(fileUrl) + '" target="_blank" rel="noopener" class="btn btn-outline-primary">' +
          '<i class="bi bi-box-arrow-up-right"></i> Open Resume' +
        "</a>" +
        '<a href="' + escapeHtml(fileUrl) + '" download="' + escapeHtml(fileName || "resume.pdf") + '" class="btn btn-primary">' +
          '<i class="bi bi-download"></i> Download Resume' +
        "</a>" +
      "</div>"
    );
  }

  function renderEmpty() {
    section.innerHTML =
      '<div class="text-center py-5">' +
        '<i class="bi bi-file-earmark-person display-4 text-muted"></i>' +
        '<p class="text-muted mt-3 mb-0">Resume will appear here once uploaded from the admin dashboard.</p>' +
      "</div>";
  }

  function buildShell(resume, fileUrl, viewerHtml) {
    const updated = resume.updatedAt
      ? '<p class="resume-updated">Last updated: ' + escapeHtml(formatDate(resume.updatedAt)) + "</p>"
      : "";

    section.innerHTML = updated + viewerHtml + renderActions(fileUrl, resume.fileName);
  }

  function fileCardHtml(fileName, message) {
    return (
      '<div class="resume-file-card">' +
        '<i class="bi bi-file-earmark-text"></i>' +
        "<div>" +
          "<strong>" + escapeHtml(fileName || "Resume file") + "</strong>" +
          '<p class="text-muted small mb-0">' + escapeHtml(message) + "</p>" +
        "</div>" +
      "</div>"
    );
  }

  async function renderPdfCanvases(fileUrl, container) {
    const pdfjs = window.pdfjsLib;
    if (!pdfjs) return false;

    if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
    }

    const pdf = await pdfjs.getDocument({ url: fileUrl }).promise;
    const pageCount = Math.min(pdf.numPages, MAX_PAGES);
    const fragment = document.createDocumentFragment();

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: RENDER_WIDTH / baseViewport.width });

      const canvas = document.createElement("canvas");
      canvas.className = "resume-page";
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", "Resume page " + pageNumber);

      await page.render({ canvasContext: canvas.getContext("2d"), viewport: viewport }).promise;
      fragment.appendChild(canvas);
    }

    if (pdf.numPages > pageCount) {
      const note = document.createElement("p");
      note.className = "text-muted small text-center mt-2 mb-0";
      note.textContent = "Showing the first " + pageCount + " of " + pdf.numPages + " pages. Download for the full document.";
      fragment.appendChild(note);
    }

    container.innerHTML = "";
    container.appendChild(fragment);
    return true;
  }

  async function fillViewer(viewer, fileUrl) {
    try {
      if (await renderPdfCanvases(fileUrl, viewer)) return;
    } catch (err) {
      console.error("PDF render error:", err);
    }

    // PDF.js unavailable or failed: iframes still work on desktop browsers.
    viewer.classList.add("resume-viewer-embed");
    viewer.innerHTML =
      '<iframe src="' + escapeHtml(fileUrl) + '" title="Resume preview" loading="lazy"></iframe>' +
      '<p class="resume-embed-note">Can\'t see the resume? Use the buttons below to open or download it.</p>';
  }

  function renderResume(resume) {
    releaseObjectUrls();

    if (!resume || !resume.fileData) {
      renderEmpty();
      return;
    }

    const blob = dataUrlToBlob(resume.fileData);
    if (!blob) {
      renderEmpty();
      return;
    }

    const fileUrl = trackObjectUrl(URL.createObjectURL(blob));
    const isPdf = blob.type === "application/pdf" || /\.pdf$/i.test(resume.fileName || "");

    if (!isPdf) {
      buildShell(resume, fileUrl, fileCardHtml(resume.fileName, "Preview is not available for this file type. Use the buttons below to open or download it."));
      return;
    }

    buildShell(
      resume,
      fileUrl,
      '<div class="resume-viewer" id="resume-viewer">' +
        '<div class="section-loading"><div class="section-spinner" role="status" aria-label="Rendering resume"></div></div>' +
      "</div>"
    );

    // Page rendering keeps its own spinner so it never holds up the preloader.
    fillViewer(document.getElementById("resume-viewer"), fileUrl);
  }

  async function loadResume() {
    try {
      const resume = await PortfolioDataStore.getResume();
      renderResume(resume);
    } catch (err) {
      console.error("Resume load error:", err);
      renderEmpty();
    } finally {
      if (loader) loader.done("resume");
    }
  }

  window.addEventListener("load", loadResume);

  PortfolioDataStore.onDataChange(function () {
    loadResume();
  });
})();
