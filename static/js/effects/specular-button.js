// ============================================================
// SPECULAR SUBMIT BUTTON
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  const specularButtons =
    document.querySelectorAll(
      '.specular-submit'
    );


  if (!specularButtons.length) {
    return;
  }


  import('https://esm.sh/ogl')
    .then(
      ({
        Renderer,
        Program,
        Mesh,
        Triangle,
        Color
      }) => {


        specularButtons.forEach((btn) => {

          const fx =
            btn.querySelector(
              '.specular-submit__fx'
            );


          if (!fx) return;


          const PAD = 20;


          const dpr =
            window.devicePixelRatio || 1;


          // ==================================================
          // SHADERS
          // ==================================================

          const VERT = `#version 300 es

            in vec2 position;

            void main() {
              gl_Position =
                vec4(position, 0.0, 1.0);
            }

          `;


          const FRAG = `#version 300 es

            precision highp float;

            uniform vec2 uCenter;
            uniform vec2 uHalfSize;
            uniform float uRadius;
            uniform float uAngle;
            uniform float uPx;

            uniform vec3 uLineColor;
            uniform vec3 uBaseColor;

            uniform float uIntensity;
            uniform float uShineSize;
            uniform float uShineFade;

            uniform float uThickness;
            uniform float uBaseWidth;

            out vec4 fragColor;


            float sdRoundedRect(
              vec2 p,
              vec2 b,
              float r
            ) {

              vec2 q =
                abs(p) - b + r;

              return
                length(max(q, 0.0))
                +
                min(
                  max(q.x, q.y),
                  0.0
                )
                -
                r;
            }


            float shapeSDF(vec2 p) {

              return sdRoundedRect(
                p,
                uHalfSize,
                uRadius
              );

            }


            float gaussianLine(
              float d,
              float sigma
            ) {

              float x =
                d /
                (sigma + 1e-6);


              float k =
                mix(
                  1.0,
                  1.6,
                  smoothstep(
                    0.0,
                    1.5,
                    x
                  )
                );


              return exp(
                -k * x * x
              );

            }


            void main() {

              vec2 p =
                gl_FragCoord.xy -
                uCenter;


              float d =
                shapeSDF(p);


              vec2 L =
                vec2(
                  cos(uAngle),
                  sin(uAngle)
                );


              float base =
                (
                  1.0 -
                  smoothstep(
                    0.0,
                    uBaseWidth,
                    abs(d)
                  )
                )
                *
                0.45;


              vec2 nEll =
                normalize(
                  p /
                  (uHalfSize * uHalfSize)
                  +
                  1e-6
                );


              float phi =
                acos(
                  clamp(
                    abs(
                      dot(nEll, L)
                    ),
                    0.0,
                    1.0
                  )
                );


              float rim =
                1.0 -
                smoothstep(
                  uShineSize -
                    uShineFade,

                  uShineSize +
                    uShineFade +
                    1e-4,

                  phi
                );


              float line =
                gaussianLine(
                  d,
                  uThickness
                );


              float edgeClamp =
                1.0 -
                smoothstep(
                  0.5 * uPx,
                  3.0 * uPx,
                  abs(d)
                );


              float hi =
                line *
                rim *
                edgeClamp *
                uIntensity;


              vec3 col =
                uBaseColor * base +
                uLineColor * hi;


              float a =
                clamp(
                  base + hi,
                  0.0,
                  1.0
                );


              fragColor =
                vec4(col, a);

            }

          `;


          // ==================================================
          // RENDERER
          // ==================================================

          const renderer =
            new Renderer({
              alpha: true,
              premultipliedAlpha: true,
              antialias: true,
              dpr
            });


          const gl =
            renderer.gl;


          gl.clearColor(
            0,
            0,
            0,
            0
          );


          gl.enable(
            gl.BLEND
          );


          gl.blendFunc(
            gl.ONE,
            gl.ONE_MINUS_SRC_ALPHA
          );


          const geometry =
            new Triangle(gl);


          if (geometry.attributes.uv) {

            delete geometry.attributes.uv;

          }


          const lineColor =
            new Color('#d4d4d4');


          const baseColor =
            new Color('#121316');


          // ==================================================
          // PROGRAM
          // ==================================================

          const program =
            new Program(
              gl,
              {
                vertex: VERT,

                fragment: FRAG,

                uniforms: {

                  uCenter: {
                    value: [0, 0]
                  },

                  uHalfSize: {
                    value: [1, 1]
                  },

                  uRadius: {
                    value: 18
                  },

                  uAngle: {
                    value: 2.4
                  },

                  uPx: {
                    value: dpr
                  },

                  uLineColor: {
                    value: [
                      lineColor.r,
                      lineColor.g,
                      lineColor.b
                    ]
                  },

                  uBaseColor: {
                    value: [
                      baseColor.r,
                      baseColor.g,
                      baseColor.b
                    ]
                  },

                  uIntensity: {
                    value: 1
                  },

                  uShineSize: {
                    value:
                      (10 * Math.PI) /
                      180
                  },

                  uShineFade: {
                    value:
                      (40 * Math.PI) /
                      180
                  },

                  uThickness: {
                    value:
                      1 * dpr
                  },

                  uBaseWidth: {
                    value: dpr
                  }

                }

              }
            );


          const mesh =
            new Mesh(
              gl,
              {
                geometry,
                program
              }
            );


          fx.appendChild(
            gl.canvas
          );


          // ==================================================
          // RESIZE
          // ==================================================

          const sizeRef = {
            w: 1,
            h: 1
          };


          const resize = () => {

            const rect =
              btn.getBoundingClientRect();


            sizeRef.w =
              rect.width;


            sizeRef.h =
              rect.height;


            renderer.setSize(
              rect.width + PAD * 2,
              rect.height + PAD * 2
            );


            program.uniforms
              .uCenter.value = [
                (
                  PAD +
                  rect.width / 2
                ) * dpr,

                (
                  PAD +
                  rect.height / 2
                ) * dpr
              ];


            program.uniforms
              .uHalfSize.value = [
                (
                  rect.width / 2
                ) * dpr,

                (
                  rect.height / 2
                ) * dpr
              ];

          };


          const resizeObserver =
            new ResizeObserver(
              resize
            );


          resizeObserver.observe(
            btn
          );


          resize();


          // ==================================================
          // POINTER
          // ==================================================

          let pointerAngle = null;

          let proximityT = 0;

          const proximity = 250;


          const onPointerMove =
            (event) => {

              const rect =
                btn.getBoundingClientRect();


              const cx =
                rect.left +
                rect.width / 2;


              const cy =
                rect.top +
                rect.height / 2;


              const dx =
                Math.max(
                  rect.left -
                    event.clientX,

                  0,

                  event.clientX -
                    rect.right
                );


              const dy =
                Math.max(
                  rect.top -
                    event.clientY,

                  0,

                  event.clientY -
                    rect.bottom
                );


              const dist =
                Math.hypot(
                  dx,
                  dy
                );


              proximityT =
                Math.max(
                  0,

                  Math.min(
                    1,

                    1 -
                    dist /
                    proximity
                  )
                );


              const px =
                event.clientX -
                cx;


              const py =
                event.clientY -
                cy;


              if (
                px !== 0 ||
                py !== 0
              ) {

                pointerAngle =
                  Math.atan2(
                    py,
                    px
                  );

              }

            };


          window.addEventListener(
            'pointermove',
            onPointerMove
          );


          // ==================================================
          // RENDER LOOP
          // ==================================================

          const render = () => {

            if (
              pointerAngle !== null
            ) {

              program.uniforms
                .uAngle.value =
                pointerAngle;

            }


            program.uniforms
              .uIntensity.value =
              proximityT;


            renderer.render({
              scene: mesh
            });


            requestAnimationFrame(
              render
            );

          };


          render();

        });

      }
    )
    .catch(() => {

    });

});