// ============================================================
// CONTACT FORM
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  const form =
    document.getElementById('contactForm');

  if (!form) return;


  form.addEventListener('submit', (event) => {
    event.preventDefault();

    // --------------------------------------------------------
    // HTML VALIDATION
    // --------------------------------------------------------

    if (!form.checkValidity()) {

      form.reportValidity();

      return;

    }


    // --------------------------------------------------------
    submitForm();
  });

  async function submitForm() {
    const submitButton = form.querySelector('[type="submit"]');
    let status = form.querySelector('.contact-form__status');

    if (!status) {
      status = document.createElement('p');
      status.className = 'contact-form__status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      form.append(status);
    }

    submitButton.disabled = true;
    status.textContent = 'Odosielam dopyt…';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Dopyt sa nepodarilo odoslať.');
      }

      status.textContent = result.message;
      form.reset();
    } catch (error) {
      status.textContent = error.message || 'Nastala chyba pri odosielaní. Skúste to, prosím, znova.';
    } finally {
      submitButton.disabled = false;
    }
  }

});
