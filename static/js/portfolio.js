// ============================================================
// PORTFOLIO ACCORDION GALLERY
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('.portfolio-video').forEach((card) => {
    const video = card.querySelector('video');

    card.addEventListener('click', () => {
      card.classList.add('is-color');
    });

    video?.addEventListener('play', () => {
      card.classList.add('is-color');
    });
  });

  const galleries =
    document.querySelectorAll(
      '.accordion-gallery'
    );


  if (
    !galleries.length ||
    typeof window.gsap === 'undefined'
  ) {
    return;
  }


  const gsap = window.gsap;


  galleries.forEach((gallery) => {

    const panels = Array.from(
      gallery.querySelectorAll(
        '.accordion-gallery__panel'
      )
    );

    const media = panels.map((panel) =>
      panel.querySelector(
        '.accordion-gallery__media'
      )
    );

    const labels = panels.map((panel) =>
      panel.querySelector(
        '.accordion-gallery__label'
      )
    );

    const bars = panels.map((panel) =>
      panel.querySelector(
        '.accordion-gallery__bar'
      )
    );

    const texts = panels.map((panel) =>
      panel.querySelector(
        '.accordion-gallery__text'
      )
    );


    if (!panels.length) return;


    // ========================================================
    // ANIMATION SETTINGS
    // ========================================================

    const duration = 0.6;

    const ease = 'power3.out';

    const gap = 10;

    const expandRatio = 0.52;

    const parallax = 0.5;

    const tilt = 8;

    const stagger = 0.06;


    // ========================================================
    // STATE
    // ========================================================

    let active = 2;

    let timeline = null;


    const reduceMotion =
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;


    // ========================================================
    // LAYOUT
    // ========================================================

    function layout(animate = true) {

      const count = panels.length;

      const rect =
        gallery.getBoundingClientRect();


      const usable = Math.max(
        rect.width -
        gap * (count - 1),
        120
      );


      const r = Math.min(
        Math.max(
          expandRatio,
          0.2
        ),
        0.9
      );


      const grow =
        count > 1
          ? (r * (count - 1)) /
            (1 - r)
          : 1;


      const mediaSize = Math.max(
        140,
        usable * r * 1.22
      );


      gallery.style.setProperty(
        '--ag-media-size',
        `${mediaSize}px`
      );


      // ------------------------------------------------------
      // KILL PREVIOUS TIMELINE
      // ------------------------------------------------------

      if (timeline) {
        timeline.kill();
      }


      timeline = gsap.timeline();


      const durationValue =
        animate && !reduceMotion
          ? duration
          : 0;


      // ------------------------------------------------------
      // PANELS
      // ------------------------------------------------------

      panels.forEach((panel, index) => {

        const isActive =
          index === active;


        const rotation =
          isActive
            ? 0
            : index < active
              ? tilt
              : -tilt;


        const drift = Math.max(
          -1.5,
          Math.min(
            1.5,
            active - index
          )
        );


        const shift =
          drift *
          parallax *
          mediaSize *
          0.06;


        // ----------------------------------------------------
        // PANEL
        // ----------------------------------------------------

        timeline.to(
          panel,
          {
            flexGrow:
              isActive
                ? grow
                : 1,

            rotateY:
              rotation,

            duration:
              durationValue,

            ease
          },
          0
        );


        // ----------------------------------------------------
        // IMAGE
        // ----------------------------------------------------

        timeline.to(
          media[index],
          {
            xPercent: -50,

            yPercent: -50,

            x:
              isActive
                ? 0
                : shift,

            '--ag-gray':
              isActive
                ? 0
                : 1,

            '--ag-dim':
              isActive
                ? 0
                : 0.35,

            duration:
              durationValue,

            ease
          },
          0
        );


        // ----------------------------------------------------
        // LABEL
        // ----------------------------------------------------

        timeline.to(
          labels[index],
          {
            opacity:
              isActive
                ? 1
                : 0,

            duration:
              durationValue,

            ease
          },
          0
        );


        // ----------------------------------------------------
        // LABEL BAR + TEXT
        // ----------------------------------------------------

        timeline.to(
          [
            bars[index],
            texts[index]
          ],
          {
            x:
              isActive
                ? 0
                : -14,

            duration:
              durationValue,

            ease,

            stagger:
              reduceMotion
                ? 0
                : stagger
          },
          0
        );


        // ----------------------------------------------------
        // ACTIVE CLASS
        // ----------------------------------------------------

        panel.classList.toggle(
          'accordion-gallery__panel--active',
          isActive
        );


        panel.setAttribute(
          'aria-current',
          isActive
            ? 'true'
            : 'false'
        );

      });

    }


    // ========================================================
    // SET ACTIVE PANEL
    // ========================================================

    function setActive(index) {

      active =
        (
          index +
          panels.length
        ) %
        panels.length;


      layout(true);

    }


    // ========================================================
    // PANEL INTERACTIONS
    // ========================================================

    panels.forEach((panel, index) => {


      // ------------------------------------------------------
      // HOVER
      // ------------------------------------------------------

      panel.addEventListener(
        'mouseenter',
        () => {
          setActive(index);
        }
      );


      // ------------------------------------------------------
      // KEYBOARD FOCUS
      // ------------------------------------------------------

      panel.addEventListener(
        'focus',
        () => {
          setActive(index);
        }
      );


      // ------------------------------------------------------
      // CLICK
      // ------------------------------------------------------

      panel.addEventListener(
        'click',
        () => {
          setActive(index);
        }
      );


      // ------------------------------------------------------
      // KEYBOARD ARROWS
      // ------------------------------------------------------

      panel.addEventListener(
        'keydown',
        (event) => {

          if (
            event.key === 'ArrowRight' ||
            event.key === 'ArrowDown'
          ) {

            event.preventDefault();

            setActive(
              index + 1
            );

            panels[active].focus();

          }


          if (
            event.key === 'ArrowLeft' ||
            event.key === 'ArrowUp'
          ) {

            event.preventDefault();

            setActive(
              index - 1
            );

            panels[active].focus();

          }

        }
      );

    });


    // ========================================================
    // RESIZE
    // ========================================================

    const resizeObserver =
      new ResizeObserver(() => {

        layout(false);

      });


    resizeObserver.observe(
      gallery
    );


    // ========================================================
    // INITIAL LAYOUT
    // ========================================================

    layout(false);

  });

});
