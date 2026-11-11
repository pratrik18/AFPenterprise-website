// ============================================================
// MOLTEN METAL BACKGROUND — OPTIMIZED
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  const moltenBg = document.querySelector('.hero .molten-metal-bg');

  if (!moltenBg) return;


  import('https://esm.sh/ogl')
    .then(({ Renderer, Program, Mesh, Triangle }) => {

      if (!moltenBg.isConnected) return;


      // ======================================================
      // SETTINGS
      // ======================================================

      // Nižšie rozlíšenie WebGL canvasu.
      // 1.25 je výrazne lacnejšie než pôvodné 2.0
      // a na hero backgroundu je vizuálny rozdiel malý.
      const MAX_DPR = 1.25;

      // Shader nepotrebuje 60 FPS.
      // 30 FPS je pre background úplne postačujúce.
      const TARGET_FPS = 60;
      const FRAME_TIME = 1000 / TARGET_FPS;


      // ======================================================
      // COLOR HELPER
      // ======================================================

      const hexToRgb = (hex) => {

        const result =
          /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i
            .exec(hex);

        if (!result) {
          return [1, 1, 1];
        }

        return [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255
        ];

      };


      // ======================================================
      // COLORS
      // ======================================================

      const color1 = hexToRgb('#121316');
      const color2 = hexToRgb('#714B69');
      const color3 = hexToRgb('#FFFFFF');


      // ======================================================
      // VERTEX SHADER
      // ======================================================

      const vertex = `#version 300 es

        in vec2 position;

        void main() {

          gl_Position =
            vec4(
              position,
              0.0,
              1.0
            );

        }

      `;


      // ======================================================
      // FRAGMENT SHADER
      // ======================================================

      const fragment = `#version 300 es

        precision highp float;

        uniform vec2 iResolution;
        uniform float iTime;

        uniform float uSpeed;
        uniform float uScale;
        uniform float uDetail;
        uniform float uGlow;
        uniform float uCoreSize;
        uniform float uSwirl;
        uniform float uFold;
        uniform float uBlackPoint;
        uniform float uBrightness;

        uniform float uGrain;
        uniform float uGrainIntensity;
        uniform float uOpacity;

        uniform vec2 uMouse;
        uniform float uMouseStrength;

        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;

        out vec4 fragColor;


        float hash(vec2 p) {

          return fract(
            sin(
              dot(
                p,
                vec2(
                  12.9898,
                  78.233
                )
              )
            )
            * 43758.5453
          );

        }


        void main() {

          float time =
            iTime * uSpeed;


          vec2 p =
            uScale *
            (
              (
                gl_FragCoord.xy -
                0.5 *
                iResolution.xy
              )
              /
              iResolution.y
            )
            -
            0.5;


          vec2 drift =
            (uMouse - 0.5)
            *
            uMouseStrength
            *
            2.0;


          p += drift;


          vec2 i = p;


          float c = 0.0;


          float r =
            length(
              p +
              vec2(
                sin(time),
                sin(
                  time * 0.3 +
                  5.0
                )
              )
              *
              0.5
            );


          float d =
            length(p);


          float rot =
            d +
            time +
            p.x *
            uSwirl;


          float cosRot =
            cos(rot);


          mat2 warp =
            mat2(

              cos(
                rot -
                sin(
                  time / 5.0
                )
              ),

              sin(rot),

              -sin(
                cosRot -
                time
              ),

              cosRot

            )
            *
            uFold;


          float glowCore =
            uGlow *
            uCoreSize;


          // ==================================================
          // OPTIMIZED ITERATIONS
          // ==================================================
          //
          // Pôvodne:
          // n < 8.0 + uDetail = 3
          //
          // Teraz:
          // maximálne 2 iterácie.
          //
          // To výrazne znižuje počet trigonometrických
          // výpočtov pre každý pixel.
          // ==================================================

          for (
            float n = 0.0;
            n < 2.0;
            n++
          ) {

            p *= warp;


            float t =
              r -
              time /
              (n + 3.0);


            i -=
              p +
              vec2(

                cos(
                  t -
                  i.x -
                  r
                )
                +
                sin(
                  t +
                  i.y
                ),

                sin(
                  t -
                  i.y
                )
                +
                cos(
                  t +
                  i.x
                )
                +
                r

              );


            c +=
              glowCore /
              length(
                vec2(
                  sin(
                    i.x + t
                  ),
                  cos(
                    i.y + t
                  )
                )
              );

          }


          c /= 6.0;


          float intensity =
            max(
              c -
              uBlackPoint,
              0.0
            )
            *
            uBrightness;


          float g =
            clamp(
              intensity,
              0.0,
              1.0
            );


          vec3 col =
            mix(
              uColor1,
              uColor2,
              smoothstep(
                0.0,
                0.5,
                g
              )
            );


          col =
            mix(
              col,
              uColor3,
              smoothstep(
                0.5,
                1.0,
                g
              )
            );


          float a = g;


          // Grain vypnutý.
          // WebGL shader už aj tak vytvára dostatočne
          // organický obraz a grain sa rieši globálnym
          // film overlayom stránky.
          if (uGrain > 0.5) {

            float gr =
              hash(
                gl_FragCoord.xy +
                iTime
              );

            a +=
              (
                gr -
                0.5
              )
              *
              uGrainIntensity;

          }


          a =
            clamp(
              a,
              0.0,
              1.0
            )
            *
            uOpacity;


          fragColor =
            vec4(
              col * a,
              a
            );

        }

      `;


      // ======================================================
      // RENDERER
      // ======================================================

      const renderer =
        new Renderer({

          webgl: 2,

          alpha: true,

          premultipliedAlpha: true,

          antialias: false,

          dpr:
            Math.min(
              window.devicePixelRatio || 1,
              MAX_DPR
            )

        });


      const gl =
        renderer.gl;


      gl.clearColor(
        0,
        0,
        0,
        0
      );


      // ======================================================
      // CANVAS
      // ======================================================

      const canvas =
        gl.canvas;


      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvas.style.pointerEvents = 'none';


      moltenBg.appendChild(canvas);


      // ======================================================
      // GEOMETRY
      // ======================================================

      const geometry =
        new Triangle(gl);


      // ======================================================
      // PROGRAM
      // ======================================================

      const program =
        new Program(
          gl,
          {

            vertex,

            fragment,

            uniforms: {

              iTime: {
                value: 0
              },

              iResolution: {
                value:
                  new Float32Array([
                    1,
                    1
                  ])
              },

              uSpeed: {
                value: 0.35
              },

              uScale: {
                value: 4
              },

              // Znížené z 3 na 2.
              uDetail: {
                value: 2
              },

              uGlow: {
                value: 1.6
              },

              uCoreSize: {
                value: 0.1
              },

              uSwirl: {
                value: 1
              },

              uFold: {
                value: -0.2
              },

              uBlackPoint: {
                value: 0.05
              },

              uBrightness: {
                value: 1.3
              },

              // Grain vypnutý.
              uGrain: {
                value: 0
              },

              uGrainIntensity: {
                value: 0.05
              },

              uOpacity: {
                value: 1
              },

              uMouse: {
                value:
                  new Float32Array([
                    0.5,
                    0.5
                  ])
              },

              uMouseStrength: {
                value: 0.3
              },

              uColor1: {
                value:
                  new Float32Array(
                    color1
                  )
              },

              uColor2: {
                value:
                  new Float32Array(
                    color2
                  )
              },

              uColor3: {
                value:
                  new Float32Array(
                    color3
                  )
              }

            }

          }
        );


      // ======================================================
      // MESH
      // ======================================================

      const mesh =
        new Mesh(
          gl,
          {
            geometry,
            program
          }
        );


      // ======================================================
      // RESIZE
      // ======================================================

      const resize = () => {

        const rect =
          moltenBg.getBoundingClientRect();


        const width =
          Math.max(
            1,
            Math.floor(
              rect.width
            )
          );


        const height =
          Math.max(
            1,
            Math.floor(
              rect.height
            )
          );


        renderer.setSize(
          width,
          height
        );


        program.uniforms
          .iResolution.value[0] =
          gl.drawingBufferWidth;


        program.uniforms
          .iResolution.value[1] =
          gl.drawingBufferHeight;


        renderer.render({
          scene: mesh
        });

      };


      const resizeObserver =
        new ResizeObserver(
          resize
        );


      resizeObserver.observe(
        moltenBg
      );


      resize();


      // ======================================================
      // MOUSE
      // ======================================================

      const targetMouse =
        [0.5, 0.5];


      const currentMouse =
        [0.5, 0.5];


      const onMouseMove =
        (event) => {

          targetMouse[0] =
            event.clientX /
            Math.max(
              1,
              window.innerWidth
            );


          targetMouse[1] =
            1 -
            event.clientY /
            Math.max(
              1,
              window.innerHeight
            );

        };


      window.addEventListener(
        'mousemove',
        onMouseMove,
        {
          passive: true
        }
      );


      // ======================================================
      // VISIBILITY
      // ======================================================

      let pageVisible =
        !document.hidden;


      let heroVisible =
        true;


      // ======================================================
      // ANIMATION
      // ======================================================

      let raf = 0;

      let lastFrame = 0;

      const startTime =
        performance.now();


      const loop = (time) => {

        if (
          !pageVisible ||
          !heroVisible
        ) {

          raf = 0;

          return;

        }


        // ================================================
        // 30 FPS LIMIT
        // ================================================

        if (
          time -
          lastFrame <
          FRAME_TIME
        ) {

          raf =
            requestAnimationFrame(
              loop
            );

          return;

        }


        lastFrame =
          time;


        program.uniforms
          .iTime.value =

          (
            time -
            startTime
          )
          *
          0.001;


        currentMouse[0] +=
          0.05 *
          (
            targetMouse[0] -
            currentMouse[0]
          );


        currentMouse[1] +=
          0.05 *
          (
            targetMouse[1] -
            currentMouse[1]
          );


        program.uniforms
          .uMouse.value[0] =
          currentMouse[0];


        program.uniforms
          .uMouse.value[1] =
          currentMouse[1];


        renderer.render({
          scene: mesh
        });


        raf =
          requestAnimationFrame(
            loop
          );

      };


      // ======================================================
      // START / STOP
      // ======================================================

      const start = () => {

        if (
          pageVisible &&
          heroVisible &&
          raf === 0
        ) {

          raf =
            requestAnimationFrame(
              loop
            );

        }

      };


      const stop = () => {

        if (raf !== 0) {

          cancelAnimationFrame(
            raf
          );

          raf = 0;

        }

      };


      // ======================================================
      // PAGE VISIBILITY
      // ======================================================

      const onVisibilityChange =
        () => {

          pageVisible =
            !document.hidden;


          if (pageVisible) {

            start();

          } else {

            stop();

          }

        };


      document.addEventListener(
        'visibilitychange',
        onVisibilityChange
      );


      // ======================================================
      // HERO VISIBILITY
      // ======================================================

      const heroObserver =
        new IntersectionObserver(
          (entries) => {

            heroVisible =
              entries[0].isIntersecting;


            if (heroVisible) {

              start();

            } else {

              stop();

            }

          },
          {
            threshold: 0.01
          }
        );


      heroObserver.observe(
        moltenBg
      );


      // ======================================================
      // START
      // ======================================================

      start();


      // ======================================================
      // CLEANUP
      // ======================================================

      window.addEventListener(
        'beforeunload',
        () => {

          stop();

          resizeObserver.disconnect();

          heroObserver.disconnect();

          window.removeEventListener(
            'mousemove',
            onMouseMove
          );

          document.removeEventListener(
            'visibilitychange',
            onVisibilityChange
          );

          gl
            .getExtension(
              'WEBGL_lose_context'
            )
            ?.loseContext();

        },
        {
          once: true
        }
      );

    })
    .catch((error) => {

      console.warn(
        'MoltenMetal background sa nepodarilo inicializovať:',
        error
      );

    });

});