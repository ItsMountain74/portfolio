/**
 * Keeps the preloader on screen until every dynamic section has rendered,
 * so visitors never see the template's placeholder content.
 *
 * Renderers call register() while their script is parsed (before any async
 * work starts) and done() once they have painted, which is why an early
 * done() cannot empty the set prematurely.
 */
window.SiteLoader = (function () {
  "use strict";

  const MAX_WAIT = 8000;

  const pending = new Set();
  let hidden = false;
  let waitingForLoad = false;

  function reveal() {
    const preloader = document.getElementById("preloader");
    if (preloader) {
      preloader.classList.add("preloader-hide");
      setTimeout(function () {
        preloader.remove();
      }, 700);
    }

    if (typeof AOS !== "undefined" && AOS.refresh) {
      AOS.refresh();
    }
  }

  function hide() {
    if (hidden) return;

    if (document.readyState !== "complete") {
      if (!waitingForLoad) {
        waitingForLoad = true;
        window.addEventListener("load", hide, { once: true });
      }
      return;
    }

    hidden = true;
    clearTimeout(safetyTimer);
    reveal();
  }

  function register(key) {
    if (!hidden) pending.add(key);
  }

  function done(key) {
    pending.delete(key);
    if (pending.size === 0) hide();
  }

  // Never trap the visitor behind the preloader if a data source hangs.
  const safetyTimer = setTimeout(hide, MAX_WAIT);

  window.addEventListener("load", function () {
    if (pending.size === 0) hide();
  });

  return {
    register: register,
    done: done,
    hide: hide
  };
})();
