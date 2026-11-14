// ============================================================
// MAGIC BENTO EFFECTS
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  const magicCards =
    document.querySelectorAll(
      '.magic-bento-form-card'
    );


  if (
    !magicCards.length ||
    typeof window.gsap === 'undefined'
  ) {
    return;
  }

  const hasFinePointer =
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const gsap = window.gsap;


  const reducedMotion =
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;


  magicCards.forEach((card) => {

    if (reducedMotion) return;


    let hover = false;

    const particles = [];

    const particleCount = 8;


    // ========================================================
    // PARTICLES
    // ========================================================

    function initializeParticles() {

      if (particles.length) return;


      const rect =
        card.getBoundingClientRect();


      for (
        let i = 0;
        i < particleCount;
        i += 1
      ) {

        const particle =
          document.createElement('span');


        particle.className =
          'magic-bento-particle';


        particle.style.left =
          `${Math.random() * rect.width}px`;


        particle.style.top =
          `${Math.random() * rect.height}px`;


        particle.style.opacity = '0';


        card.appendChild(
          particle
        );


        particles.push(
          particle
        );

      }

    }


    // ========================================================
    // CLEAR PARTICLES
    // ========================================================

    function clearParticles() {

      particles.forEach(
        (particle) => {

          gsap.killTweensOf(particle);

          gsap.to(
            particle,
            {
              scale: 0,

              opacity: 0,

              duration: 0.2,

              ease: 'power2.out'
            }
          );

        }
      );

    }


    // ========================================================
    // ANIMATE PARTICLES
    // ========================================================

    function animateParticles() {

      if (!hover) return;


      initializeParticles();


      particles.forEach(
        (particle, index) => {

          gsap.killTweensOf(particle);

          gsap.to(
            particle,
            {
              opacity: 0.75,

              scale: 1,

              x:
                (Math.random() - 0.5) *
                70,

              y:
                (Math.random() - 0.5) *
                70,

              duration:
                1.4 +
                Math.random() * 1.4,

              delay:
                index * 0.05,

              ease:
                'sine.inOut',

              repeat: -1,

              yoyo: true
            }
          );

        }
      );

    }


    // ========================================================
    // RESET CARD
    // ========================================================

    function resetCard() {

      gsap.to(
        card,
        {
          rotateX: 0,

          rotateY: 0,

          x: 0,

          y: 0,

          duration: 0.3,

          ease: 'power2.out'
        }
      );


      card.style.setProperty(
        '--glow-intensity',
        '0'
      );


      clearParticles();

    }


    // ========================================================
    // MOUSE ENTER
    // ========================================================

    if (hasFinePointer) {
      card.addEventListener(
        'mouseenter',
        () => {
          hover = true;
          animateParticles();
        }
      );
    }


    // ========================================================
    // MOUSE LEAVE
    // ========================================================

    if (hasFinePointer) {
      card.addEventListener(
        'mouseleave',
        () => {
          hover = false;
          resetCard();
        }
      );
    }

    // Touch devices keep particles active until the user taps outside the card.
    if (!hasFinePointer) {
      card.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;

        hover = true;
        card.style.setProperty('--glow-intensity', '0');
        animateParticles();

      });

      document.addEventListener('pointerdown', (event) => {
        if (!card.contains(event.target) && hover) {
          hover = false;
          card.style.setProperty('--glow-intensity', '0');
          clearParticles();
        }
      });
    }


    // ========================================================
    // MOUSE MOVE
    // ========================================================

    card.addEventListener(
      'mousemove',
      (event) => {

        if (!hover || !hasFinePointer) return;


        const rect =
          card.getBoundingClientRect();


        const x =
          event.clientX -
          rect.left;


        const y =
          event.clientY -
          rect.top;


        const centerX =
          rect.width / 2;


        const centerY =
          rect.height / 2;


        const rotateX =
          (
            (y - centerY) /
            centerY
          ) * -5;


        const rotateY =
          (
            (x - centerX) /
            centerX
          ) * 5;


        const glowX =
          (x / rect.width) * 100;


        const glowY =
          (y / rect.height) * 100;


        card.style.setProperty(
          '--glow-x',
          `${glowX}%`
        );


        card.style.setProperty(
          '--glow-y',
          `${glowY}%`
        );


        card.style.setProperty(
          '--glow-intensity',
          '1'
        );


        gsap.to(
          card,
          {
            rotateX,

            rotateY,

            x:
              (x - centerX) *
              0.018,

            y:
              (y - centerY) *
              0.018,

            duration: 0.18,

            ease: 'power2.out',

            transformPerspective: 1000,

            overwrite: true
          }
        );

      }
    );


    // ========================================================
    // CLICK RIPPLE
    // ========================================================

    card.addEventListener(
      'click',
      (event) => {

        if (!hasFinePointer) return;

        const rect =
          card.getBoundingClientRect();


        const x =
          event.clientX -
          rect.left;


        const y =
          event.clientY -
          rect.top;


        const ripple =
          document.createElement(
            'span'
          );


        const size =
          Math.max(
            rect.width,
            rect.height
          ) * 1.5;


        ripple.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          left: ${x - size / 2}px;
          top: ${y - size / 2}px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 1;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.18) 0%,
            rgba(215, 205, 184, 0.08) 35%,
            transparent 70%
          );
        `;


        card.appendChild(
          ripple
        );


        gsap.fromTo(
          ripple,

          {
            scale: 0,

            opacity: 1
          },

          {
            scale: 1,

            opacity: 0,

            duration: 0.7,

            ease: 'power2.out',

            onComplete: () => {
              ripple.remove();
            }
          }
        );

      }
    );

  });

});
