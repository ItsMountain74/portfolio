/**
 * Image compression shared by the admin uploaders.
 *
 * Images are inlined as base64 in the JSON data files and mirrored into
 * localStorage, where a data URL costs roughly 2.7x its decoded size (base64
 * inflation plus UTF-16 storage). Encoding therefore targets a hard byte
 * budget instead of a fixed quality, dropping quality and then dimensions
 * until the result fits.
 */
window.PortfolioImages = (function () {
  "use strict";

  const KB = 1024;

  const PRESETS = {
    profile: { maxWidth: 600, maxBytes: 70 * KB },
    hero: { maxWidth: 1600, maxBytes: 260 * KB },
    thumbnail: { maxWidth: 800, maxBytes: 130 * KB },
    screenshot: { maxWidth: 1400, maxBytes: 200 * KB }
  };

  const QUALITY_STEPS = [0.82, 0.68, 0.55, 0.45];
  const MIN_WIDTH = 360;

  let webpSupport = null;

  function supportsWebp() {
    if (webpSupport === null) {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      webpSupport = canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
    }
    return webpSupport;
  }

  /** Decoded byte size of a base64 data URL. */
  function dataUrlBytes(dataUrl) {
    if (!dataUrl) return 0;
    const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
    const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
    return Math.max(0, Math.round((base64.length * 3) / 4) - padding);
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 KB";
    if (bytes < KB * KB) return Math.max(1, Math.round(bytes / KB)) + " KB";
    return (bytes / (KB * KB)).toFixed(2) + " MB";
  }

  function loadImageElement(src) {
    return new Promise(function (resolve, reject) {
      const img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error("Image could not be decoded")); };
      img.src = src;
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function (event) { resolve(event.target.result); };
      reader.onerror = function () { reject(new Error("File could not be read")); };
      reader.readAsDataURL(file);
    });
  }

  function drawToCanvas(img, width) {
    const height = Math.max(1, Math.round((img.height * width) / img.width));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // WebP and JPEG have no alpha budget here; a white matte avoids black
    // fringing when a transparent PNG is flattened.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    return canvas;
  }

  function encodeWithinBudget(img, maxWidth, maxBytes) {
    const mime = supportsWebp() ? "image/webp" : "image/jpeg";
    let width = Math.min(img.width, maxWidth);
    let smallest = null;

    while (width >= MIN_WIDTH) {
      const canvas = drawToCanvas(img, width);

      for (const quality of QUALITY_STEPS) {
        const dataUrl = canvas.toDataURL(mime, quality);
        const bytes = dataUrlBytes(dataUrl);

        if (bytes <= maxBytes) return dataUrl;
        if (!smallest || bytes < smallest.bytes) {
          smallest = { dataUrl: dataUrl, bytes: bytes };
        }
      }

      if (width === MIN_WIDTH) break;
      width = Math.max(MIN_WIDTH, Math.round(width * 0.75));
    }

    return smallest ? smallest.dataUrl : null;
  }

  function resolvePreset(preset) {
    if (typeof preset === "string") return PRESETS[preset] || PRESETS.screenshot;
    return Object.assign({}, PRESETS.screenshot, preset || {});
  }

  /** Compress a File chosen in an <input type="file">. */
  async function compressFile(file, preset) {
    const { maxWidth, maxBytes } = resolvePreset(preset);
    const source = await readFileAsDataUrl(file);
    const img = await loadImageElement(source);
    const result = encodeWithinBudget(img, maxWidth, maxBytes);

    if (!result) throw new Error("Image could not be compressed");

    // A tiny original can already beat anything we re-encode.
    return dataUrlBytes(source) <= dataUrlBytes(result) ? source : result;
  }

  /** Re-compress an already stored data URL. Returns null when it is small enough. */
  async function shrinkDataUrl(dataUrl, preset) {
    if (typeof dataUrl !== "string" || dataUrl.indexOf("data:image/") !== 0) return null;

    const { maxWidth, maxBytes } = resolvePreset(preset);
    if (dataUrlBytes(dataUrl) <= maxBytes) return null;

    const img = await loadImageElement(dataUrl);
    const result = encodeWithinBudget(img, maxWidth, maxBytes);

    if (!result || dataUrlBytes(result) >= dataUrlBytes(dataUrl)) return null;
    return result;
  }

  return {
    PRESETS: PRESETS,
    compressFile: compressFile,
    shrinkDataUrl: shrinkDataUrl,
    dataUrlBytes: dataUrlBytes,
    formatBytes: formatBytes
  };
})();
