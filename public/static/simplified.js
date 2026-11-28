const form = document.querySelector('#serviceForm');
const status = document.querySelector('#formMessage');

document.querySelectorAll('.chooser button').forEach((button) => {
  button.classList.add('specular-submit');
  if (!button.classList.contains('specular-submit--lg')) button.classList.add('specular-submit--md');
  button.style.setProperty('--sb-radius', '18px');
  button.style.setProperty('--sb-tint', '#ffffff');
  button.style.setProperty('--sb-tint-opacity', '.04');
  button.style.setProperty('--sb-text-color', '#f5f5f5');

  if (button.querySelector('.specular-submit__fx')) return;

  const effect = document.createElement('span');
  effect.className = 'specular-submit__fx';
  effect.setAttribute('aria-hidden', 'true');

  const label = document.createElement('span');
  label.className = 'specular-submit__label';
  while (button.firstChild) label.append(button.firstChild);
  button.append(effect, label);
});

function updateSummary() {
  const types = [...(form?.querySelectorAll('[name="type"]:checked') || [])].map((input) => input.value);
  const name = form?.elements.name?.value.trim();
  const email = form?.elements.email?.value.trim();
  document.querySelector('#summaryType').textContent = types.join(', ') || 'Zatiaľ nevybraný';
  document.querySelector('#summaryContact').textContent = name && email ? `${name} · ${email}` : 'Doplňte meno a e-mail';
}

form?.addEventListener('input', updateSummary);
form?.addEventListener('change', updateSummary);
const wizardSteps = [...document.querySelectorAll('[data-wizard-step]')];

function showWizardStep(stepNumber) {
  wizardSteps.forEach((step) => {
    const active = Number(step.dataset.wizardStep) === stepNumber;
    step.hidden = !active;
    step.setAttribute('aria-hidden', String(!active));
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const activeStep = wizardSteps.find((step) => Number(step.dataset.wizardStep) === stepNumber);
  activeStep?.querySelector('h1, h2')?.focus({ preventScroll: true });
}

document.querySelectorAll('[data-next]').forEach((button) => button.addEventListener('click', () => {
  const target = Number(button.dataset.next);
  if (target === 2) {
    const selectedTypes = form.querySelectorAll('[name="type"]:checked');
    if (!selectedTypes.length) {
      form.querySelector('.choice input')?.focus();
      return;
    }
  }
  if (target === 3) {
    const requiredFields = [form.elements.name, form.elements.email, form.elements.message, form.elements.privacy_acknowledgement];
    const invalidField = requiredFields.find((field) => !field.checkValidity());
    if (invalidField) {
      invalidField.reportValidity();
      return;
    }
  }
  showWizardStep(target);
}));

document.querySelectorAll('[data-back]').forEach((button) => button.addEventListener('click', () => {
  showWizardStep(Number(button.dataset.back));
}));

document.querySelectorAll('[data-go-to]').forEach((button) => button.addEventListener('click', () => {
  showWizardStep(Number(button.dataset.goTo));
}));
updateSummary();

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const selectedTypes = [...form.querySelectorAll('[name="type"]:checked')].map((input) => input.value);
  if (!selectedTypes.length) {
    form.querySelector('[name="type"]')?.setCustomValidity('Vyberte aspoň jednu možnosť.');
    form.reportValidity();
    return;
  }

  const data = new FormData(form);
  const selectedType = selectedTypes.join(', ');
  data.delete('type');
  data.set('type', 'Iné');
  const details = String(data.get('message') || '').trim();
  data.set('message', `Typ požadovanej služby: ${selectedType}.${details ? `\n\nDoplňujúce informácie:\n${details}` : ''}`);
  const button = form.querySelector('button[type="submit"]');
  const buttonLabel = button.querySelector('.specular-submit__label');
  const originalLabel = buttonLabel?.textContent || button.textContent;
  button.disabled = true;
  if (buttonLabel) buttonLabel.textContent = 'Odosielam…';
  else button.textContent = 'Odosielam…';
  if (status) status.textContent = 'Odosielame váš dopyt.';

  try {
    const response = await fetch('/api/contact', { method: 'POST', body: data });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Dopyt sa nepodarilo odoslať.');
    form.innerHTML = `<div class="success"><span class="eyebrow">AFP / ĎAKUJEME</span><h2>Požiadavka bola<br><em>odoslaná.</em></h2><p>${escapeHtml(result.message)}</p><p class="success__exit">Túto stránku môžete teraz bezpečne opustiť alebo zavrieť.</p></div>`;
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (error) {
    if (status) {
      status.textContent = error.message || 'Nastala chyba. Skúste to znova.';
      status.style.color = '#ff9b9b';
    }
    button.disabled = false;
    if (buttonLabel) buttonLabel.textContent = originalLabel;
    else button.textContent = originalLabel;
  }
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}


