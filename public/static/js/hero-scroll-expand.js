const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const smoothstep = (start, end, value) => {
  const amount = clamp((value - start) / (end - start || 0.000001), 0, 1);
  return amount * amount * (3 - 2 * amount);
};

const parseHexColor = (value, fallback) => {
  const match = value.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (!match) return fallback;

  const hex = match[1].length === 3
    ? match[1].split('').map((digit) => digit + digit).join('')
    : match[1];

  return [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16));
};

const mixRgb = (from, to, amount) => {
  const channels = from.map((channel, index) =>
    Math.round(channel + (to[index] - channel) * amount)
  );
  return `rgb(${channels.join(' ')})`;
};

document.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('[data-scroll-expand]');
  if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const stage = hero.querySelector('.hero__stage');
  const frame = hero.querySelector('.hero__frame');
  const media = hero.querySelector('.molten-metal-bg');
  const brand = hero.querySelector('.hero__brand');
  const overlay = hero.querySelector('.hero__overlay');
  const hint = hero.querySelector('.hero__scroll-hint');
  if (!stage || !frame || !media || !brand || !overlay || !hint) return;

  const scrollDistance = 1;
  const holdDistance = 0.18;
  const mediaZoom = 1.25;
  const smoothing = 0.1;
  const mobileLayout = window.matchMedia('(max-width: 600px)');
  const rootStyles = window.getComputedStyle(document.documentElement);
  const purpleBackground = parseHexColor(rootStyles.getPropertyValue('--accent'), [113, 75, 105]);
  const pageBackground = parseHexColor(rootStyles.getPropertyValue('--bg'), [18, 19, 22]);

  let stageHeight = 0;
  let targetProgress = 0;
  let currentProgress = 0;
  let animationFrame = 0;
  let isAnimating = false;

  hero.classList.add('hero--scroll-expand');

  const measure = () => {
    stageHeight = Math.max(window.innerHeight, 1);
    hero.style.setProperty('--hero-stage-height', `${stageHeight}px`);
    hero.style.setProperty(
      '--hero-track-height',
      `${stageHeight * (1 + scrollDistance + holdDistance)}px`
    );
  };

  const readProgress = () => {
    const scrollSpan = stageHeight * scrollDistance;
    return clamp(-hero.getBoundingClientRect().top / scrollSpan, 0, 1);
  };

  const updatePinnedStage = () => {
    const heroBounds = hero.getBoundingClientRect();
    const shouldPin = heroBounds.top <= 0 && heroBounds.bottom >= stageHeight;
    const hasPassedEnd = heroBounds.top <= 0 && heroBounds.bottom < stageHeight;
    hero.classList.toggle('hero--stage-fixed', shouldPin);
    hero.classList.toggle('hero--stage-released', hasPassedEnd);
  };

  const applyProgress = (progress) => {
    const expanded = smoothstep(0, 1, progress);
    const backgroundProgress = smoothstep(0.35, 0.68, progress);
    stage.style.backgroundColor = mixRgb(purpleBackground, pageBackground, backgroundProgress);
    const startWidth = mobileLayout.matches ? 84 : 42;
    const startHeight = mobileLayout.matches ? 60 : 58;
    const width = startWidth + (100 - startWidth) * expanded;
    const height = startHeight + (100 - startHeight) * expanded;
    const insetX = Math.max(0, (100 - width) / 2);
    const insetY = Math.max(0, (100 - height) / 2);
    const radius = (mobileLayout.matches ? 18 : 24) * (1 - expanded);

    frame.style.clipPath = `inset(${insetY}% ${insetX}% round ${radius}px)`;
    media.style.transform = `scale(${mediaZoom + (1 - mediaZoom) * expanded})`;

    const titleExit = smoothstep(0.4, 0.88, progress);
    brand.style.opacity = `${1 - titleExit}`;
    brand.style.transform = `translate3d(0, ${-28 * titleExit}px, 0) scale(${1 + 0.06 * titleExit})`;

    const hintExit = smoothstep(0, 0.12, progress);
    hint.style.opacity = `${1 - hintExit}`;
    hint.style.transform = `translate3d(0, ${8 * hintExit}px, 0)`;

    const overlayEnter = smoothstep(0.68, 1, progress);
    overlay.style.opacity = `${overlayEnter}`;
    overlay.style.transform = `translate3d(0, ${18 * (1 - overlayEnter)}px, 0)`;
    overlay.style.pointerEvents = overlayEnter > 0.95 ? 'auto' : 'none';
    overlay.inert = overlayEnter <= 0.95;
    overlay.setAttribute('aria-hidden', overlayEnter > 0.95 ? 'false' : 'true');
  };

  const animate = () => {
    const follow = 1 - Math.exp(-1 / (60 * smoothing));
    currentProgress += (targetProgress - currentProgress) * follow;

    if (Math.abs(targetProgress - currentProgress) < 0.0004) {
      currentProgress = targetProgress;
      isAnimating = false;
    }

    applyProgress(currentProgress);
    animationFrame = isAnimating ? requestAnimationFrame(animate) : 0;
  };

  const onScroll = () => {
    updatePinnedStage();
    targetProgress = readProgress();
    if (!isAnimating) {
      isAnimating = true;
      if (!animationFrame) animationFrame = requestAnimationFrame(animate);
    }
  };

  const onResize = () => {
    measure();
    updatePinnedStage();
    targetProgress = readProgress();
    currentProgress = targetProgress;
    isAnimating = false;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    applyProgress(currentProgress);
  };

  measure();
  updatePinnedStage();
  targetProgress = readProgress();
  currentProgress = targetProgress;
  applyProgress(currentProgress);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
});
