import './navbar.js';
import './contact.js';
import './portfolio.js';
import './hero-scroll-expand.js';

import './effects/magic-bento.js';
import './effects/specular-button.js';
import './effects/molten-metal.js';


// Reviews carousel loops endlessly. Desktop shows three cards; mobile is swipeable.
document.addEventListener('DOMContentLoaded', () => {
  const track = document.querySelector('#reviewsTrack');
  const previousButton = document.querySelector('[data-reviews-prev]');
  const nextButton = document.querySelector('[data-reviews-next]');

  if (!track || !previousButton || !nextButton) return;

  const originals = Array.from(track.querySelectorAll('.review-card'));
  if (originals.length <= 3) return;

  let loopStep = 0;
  let normalizationTimer;
  let moveWatchdog;
  let queuedMoves = 0;
  let isMoving = false;
  let leadingClones = [];
  let trailingClones = [];
  const mobileLayout = window.matchMedia('(max-width: 700px)');

  const removeClones = () => {
    track.querySelectorAll('.review-card--clone').forEach((clone) => clone.remove());
  };

  const jumpWithoutAnimation = (left) => {
    const previousBehavior = track.style.scrollBehavior;
    track.style.scrollBehavior = 'auto';
    track.scrollLeft = left;
    track.style.scrollBehavior = previousBehavior;
  };

  const cardScrollPosition = (card) => {
    const trackLeft = track.getBoundingClientRect().left;
    const cardRect = card.getBoundingClientRect();
    const cardLeftInTrack = track.scrollLeft + cardRect.left - trackLeft;

    if (mobileLayout.matches) {
      return cardLeftInTrack + (cardRect.width - track.clientWidth) / 2;
    }

    return cardLeftInTrack;
  };

  const setupLoop = () => {
    removeClones();
    track.scrollLeft = 0;

    const cloneCount = Math.min(mobileLayout.matches ? 4 : 3, originals.length);
    const makeClone = (review) => {
      const clone = review.cloneNode(true);
      clone.classList.add('review-card--clone');
      clone.setAttribute('aria-hidden', 'true');
      return clone;
    };

    leadingClones = originals.slice(-cloneCount).map(makeClone);
    trailingClones = originals.slice(0, cloneCount).map(makeClone);
    track.prepend(...leadingClones);
    track.append(...trailingClones);

    const styles = window.getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap) || 0;
    loopStep = originals[0].getBoundingClientRect().width + gap;
    jumpWithoutAnimation(cardScrollPosition(originals[0]));
  };

  const normalizeLoopPosition = () => {
    if (!loopStep) return;

    const leftBoundary = cardScrollPosition(leadingClones[1]);
    const rightBoundary = cardScrollPosition(trailingClones[0]);

    if (track.scrollLeft <= leftBoundary + 1) {
      jumpWithoutAnimation(cardScrollPosition(originals[originals.length - leadingClones.length + 1]));
    } else if (track.scrollLeft >= rightBoundary - 1) {
      jumpWithoutAnimation(cardScrollPosition(originals[0]));
    }
  };

  const finishMove = () => {
    window.clearTimeout(normalizationTimer);
    window.clearTimeout(moveWatchdog);
    normalizeLoopPosition();
    isMoving = false;
    processQueuedMove();
  };

  const scheduleNormalization = () => {
    window.clearTimeout(normalizationTimer);
    normalizationTimer = window.setTimeout(finishMove, 140);
  };

  const processQueuedMove = () => {
    if (isMoving || queuedMoves === 0 || !loopStep) return;

    const direction = Math.sign(queuedMoves);
    queuedMoves -= direction;
    isMoving = true;
    window.clearTimeout(moveWatchdog);
    moveWatchdog = window.setTimeout(finishMove, 1200);
    track.scrollBy({ left: direction * loopStep, behavior: 'smooth' });
  };

  const scrollByOneReview = (direction) => {
    if (!loopStep) return;
    queuedMoves += direction;
    processQueuedMove();
  };

  previousButton.addEventListener('click', () => scrollByOneReview(-1));
  nextButton.addEventListener('click', () => scrollByOneReview(1));
  track.addEventListener('scroll', scheduleNormalization, { passive: true });
  window.addEventListener('resize', () => {
    window.clearTimeout(normalizationTimer);
    window.clearTimeout(moveWatchdog);
    queuedMoves = 0;
    isMoving = false;
    setupLoop();
  });
  setupLoop();
});


// ============================================================
// GLOBAL SPOTLIGHT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  const spotlight = document.querySelector('.global-spotlight');

  if (!spotlight) return;

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let pointerFrame = 0;
  let latestPointerEvent = null;

  const updateSpotlight = () => {
    pointerFrame = 0;

    if (!latestPointerEvent) return;

    const x = (latestPointerEvent.clientX / Math.max(window.innerWidth, 1) * 100).toFixed(1);
    const y = (latestPointerEvent.clientY / Math.max(window.innerHeight, 1) * 100).toFixed(1);

    spotlight.style.setProperty('--mx', `${x}%`);
    spotlight.style.setProperty('--my', `${y}%`);
    spotlight.style.opacity = '1';
  };

  document.addEventListener('pointermove', (event) => {
    latestPointerEvent = event;
    if (!pointerFrame) pointerFrame = requestAnimationFrame(updateSpotlight);
  }, { passive: true });

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
