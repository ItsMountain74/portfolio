/**
 * Contact form handler for GitHub Pages (no PHP).
 */
(function () {
  "use strict";

  const form = document.querySelector("#contact .php-email-form");
  if (!form) return;

  form.setAttribute("action", "");
  form.setAttribute("method", "post");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const loading = form.querySelector(".loading");
    const errorBox = form.querySelector(".error-message");
    const sentBox = form.querySelector(".sent-message");

    loading.classList.add("d-block");
    errorBox.classList.remove("d-block");
    sentBox.classList.remove("d-block");

    const formData = {
      name: form.querySelector('[name="name"]').value.trim(),
      email: form.querySelector('[name="email"]').value.trim(),
      subject: form.querySelector('[name="subject"]').value.trim(),
      message: form.querySelector('[name="message"]').value.trim()
    };

    try {
      const config = window.PORTFOLIO_CONFIG || {};

      if (config.formspreeEndpoint) {
        const response = await fetch(config.formspreeEndpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message
          })
        });

        if (!response.ok) {
          throw new Error("Formspree submission failed. Check your endpoint in config.js.");
        }
      }

      await PortfolioDataStore.addMessage(formData);

      loading.classList.remove("d-block");
      sentBox.classList.add("d-block");
      form.reset();
    } catch (err) {
      loading.classList.remove("d-block");
      errorBox.textContent = err.message || "Failed to send message. Please try again.";
      errorBox.classList.add("d-block");
    }
  }, true);
})();
