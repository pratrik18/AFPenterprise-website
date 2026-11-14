import './js/effects/specular-button.js';

document.addEventListener('DOMContentLoaded', () => {
  // ── Hero spotlight
  const spotlight = document.querySelector('.global-spotlight');

  if (spotlight && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let pointerFrame = 0;
    let latestPointerEvent = null;

    document.addEventListener('pointermove', (event) => {
      latestPointerEvent = event;
      if (pointerFrame) return;

      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        if (!latestPointerEvent) return;

        const x = (latestPointerEvent.clientX / Math.max(window.innerWidth, 1) * 100).toFixed(1);
        const y = (latestPointerEvent.clientY / Math.max(window.innerHeight, 1) * 100).toFixed(1);
        spotlight.style.setProperty('--mx', `${x}%`);
        spotlight.style.setProperty('--my', `${y}%`);
        spotlight.style.opacity = '1';
      });
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      spotlight.style.opacity = '0';
    });
  }

  // ── Hviezdičky
const ratingInputs = document.querySelectorAll('input[name="rating"]');
const ratingStars = document.querySelectorAll('.rating__star');
const ratingValue = document.getElementById('ratingValue');

const ratingLabels = {
  1: '1 hviezdička',
  2: '2 hviezdičky',
  3: '3 hviezdičky',
  4: '4 hviezdičky',
  5: '5 hviezdičiek'
};

function updateStars(selectedValue) {
  ratingStars.forEach((star, index) => {
    star.classList.toggle(
      'selected',
      index < selectedValue
    );
  });
}

ratingInputs.forEach((input) => {
  input.addEventListener('change', () => {
    const selectedValue = Number(input.value);

    updateStars(selectedValue);

    if (ratingValue) {
      ratingValue.textContent = ratingLabels[selectedValue];
    }
  });
});

  // ── Počítadlo textu recenzie
  const reviewText = document.getElementById('reviewText');
  const reviewCounter = document.getElementById('reviewCounter');

  if (reviewText && reviewCounter) {
    const updateCounter = () => {
      reviewCounter.textContent = String(reviewText.value.length);
    };

    reviewText.addEventListener('input', updateCounter);
    updateCounter();
  }

  // ── Frontend odoslanie
const form = document.getElementById('reviewForm');
const formMessage = document.getElementById('formMessage');
const success = document.getElementById('reviewSuccess');
const pageHead = document.querySelector('.review-card__head');

if (!form) {
  return;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (formMessage) {
    formMessage.textContent = '';
  }

  // Kontrola povinných polí
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);

  try {
    const response = await fetch('/review', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Odoslanie recenzie zlyhalo.');
    }

    // Skrytie formulára
    form.hidden = true;
    if (pageHead) {
      pageHead.hidden = true;
    }

    // Zobrazenie ďakovnej obrazovky
    if (success) {
      success.hidden = false;
      success.focus();
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  } catch (error) {
    console.error(error);

    if (formMessage) {
      formMessage.textContent =
        'Recenziu sa nepodarilo odoslať. Skúste to znova.';
    }
  }
});
});
