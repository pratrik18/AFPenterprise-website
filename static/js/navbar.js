// ============================================================
// MOBILE NAVIGATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  const navToggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');

  if (!navToggle || !nav) return;


  // ----------------------------------------------------------
  // OPEN / CLOSE MENU
  // ----------------------------------------------------------

  navToggle.addEventListener('click', () => {

    const isOpen =
      nav.classList.toggle('nav--open');

    navToggle.setAttribute(
      'aria-expanded',
      String(isOpen)
    );

  });


  // ----------------------------------------------------------
  // CLOSE MENU AFTER CLICKING LINK
  // ----------------------------------------------------------

  nav.querySelectorAll('a').forEach((link) => {

    link.addEventListener('click', () => {

      nav.classList.remove('nav--open');

      navToggle.setAttribute(
        'aria-expanded',
        'false'
      );

    });

  });

});