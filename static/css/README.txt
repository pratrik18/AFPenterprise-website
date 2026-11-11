AFP CSS split

Structure:
static/css/
├── main.css
├── navbar.css
├── hero.css
├── services.css
├── portfolio.css
├── reviews.css
├── team.css
├── contact.css
├── footer.css
└── effects/
    └── specular-button.css

The CSS rules are preserved from the uploaded style.css and separated by responsibility.
No separate molten-metal.css was created because the uploaded CSS only contains the
.molten-metal-bg container styling; the actual effect is implemented in JavaScript/WebGL.

Load them in index.html in this order:
main.css
navbar.css
hero.css
services.css
portfolio.css
reviews.css
team.css
contact.css
footer.css
effects/specular-button.css

Alternatively, main.css can be expanded later into an @import-based entry point.
