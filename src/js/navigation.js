export function initNavigation() {
  /* NAV SCROLL STATE — driven by Lenis callback when Lenis loads; native fallback kept for pages without Lenis */
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => { if (!window._lenis) nav.classList.toggle('scrolled', window.scrollY > 60); }, { passive: true });
  }

  /* === MOBILE HAMBURGER === */
  const ham = document.getElementById('navHam');
  const navLinks = document.getElementById('navLinks');
  const overlay = document.getElementById('navOverlay');
  if (ham && navLinks && overlay) {
    function toggleNav(open) {
      ham.classList.toggle('open', open);
      navLinks.classList.toggle('open', open);
      overlay.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      ham.setAttribute('aria-expanded', open);
    }
    ham.addEventListener('click', () => toggleNav(!ham.classList.contains('open')));
    overlay.addEventListener('click', () => toggleNav(false));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleNav(false)));
  }

/* === LANGUAGE PILL PLACEMENT ===
     In the top bar the pill competes with the logo, cart and hamburger at
     small widths. Below 1024px it moves inside the nav drawer, where the
     three options get full 44px targets. Moves back on resize. */
  (function () {
    var pill = document.getElementById('langPill');
    var links = document.getElementById('navLinks');
    var navEl = document.getElementById('nav') || document.querySelector('nav');
    if (!pill || !links || !navEl) return;
    var home = pill.parentNode, next = pill.nextSibling;
    var mq = window.matchMedia('(max-width:1024px)');
    function place() {
      if (mq.matches) {
        if (pill.parentNode !== links) links.appendChild(pill);
      } else if (pill.parentNode !== home) {
        home.insertBefore(pill, next);
      }
    }
    place();
    if (mq.addEventListener) mq.addEventListener('change', place);
    else if (mq.addListener) mq.addListener(place);
    /* Resize fallback: some environments (and older Safari) do not deliver
       the matchMedia change event reliably. Debounced so it stays cheap. */
    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(place, 150);
    }, { passive: true });
  })();

  /* Floating-element collisions (WhatsApp button vs cookie banner and cart
     toast) are handled entirely in CSS with :has() — no observer to fall out
     of sync, and the state is always recomputable from the DOM. */
}
