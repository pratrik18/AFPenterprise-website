import './navbar.js';
import './contact.js';
import './portfolio.js';

import './effects/magic-bento.js';
import './effects/specular-button.js';
import './effects/molten-metal.js';


// ============================================================
// GLOBAL SPOTLIGHT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  const spotlight = document.querySelector('.global-spotlight');

  if (!spotlight) return;

  document.addEventListener('mousemove', (event) => {

    const x = (
      event.clientX /
      window.innerWidth *
      100
    ).toFixed(1);

    const y = (
      event.clientY /
      window.innerHeight *
      100
    ).toFixed(1);

    spotlight.style.setProperty(
      '--mx',
      `${x}%`
    );

    spotlight.style.setProperty(
      '--my',
      `${y}%`
    );

    spotlight.style.opacity = '1';

  });

  document.addEventListener('mouseleave', () => {

    spotlight.style.opacity = '0';

  });

});

// Highlight the index of the section passing through the viewport center.
document.addEventListener('DOMContentLoaded', () => {

  const sections = document.querySelectorAll('main > .section');

  if (!sections.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle(
          'section--current',
          entry.isIntersecting
        );
      });
    },
    {
      rootMargin: '-45% 0px -45% 0px',
      threshold: 0
    }
  );

  sections.forEach((section) => observer.observe(section));

});
