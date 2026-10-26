/* Chrome gets native scrolling; Safari keeps its existing scroll behavior.
   Prefer browser brands so other Chromium browsers aren't opted in. Chrome
   on iOS uses WebKit and deliberately stays on the existing path. */
const _chromePerformance = (() => {
  const brands = navigator.userAgentData && navigator.userAgentData.brands;
  if (brands && brands.length) return brands.some(b => b.brand === 'Google Chrome');
  return /\bChrome\/\d+/.test(navigator.userAgent || '') &&
    !/\b(?:Edg|OPR|SamsungBrowser|Vivaldi|Chromium)\//.test(navigator.userAgent || '') &&
    !navigator.brave;
})();
if (_chromePerformance) document.documentElement.classList.add('chrome-performance');

/* === PRODUCT DATA (global — used by modal + cart) ===
   Only products that can actually be paid for belong here: getCart() drops
   anything not listed, so a stale cart can never reach a broken checkout.
   'harvest-2025' and 'merch-set' come back once their Stripe price IDs are
   set in netlify/functions/create-checkout.js. */
const PRODUCT_DATA = {
  'classic-500':  { nameKey:'home-p1-name', tagKey:'tag-classic', subKey:'p-sub-evoo', tag:'Classic', name:'AL WASAT Classic', sub:'Extra Virgin Olive Oil', price:'£13.99', unit:'/ 500ml', specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Polyphenols',v:'380 mg/kg'},{l:'Acidity',v:'< 0.3%'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Format',v:'500ml glass bottle'}] },
  'classic-1l':   { nameKey:'home-p1-name', tagKey:'tag-classic', subKey:'p-sub-evoo', tag:'Classic', name:'AL WASAT Classic', sub:'Extra Virgin Olive Oil', price:'£22.99', unit:'/ 1 Litre', specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Polyphenols',v:'380 mg/kg'},{l:'Acidity',v:'< 0.3%'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Format',v:'1 Litre glass bottle'}] },
  'organic-500':  { nameKey:'home-p2-name', tagKey:'tag-organic', subKey:'p-sub-organic', tag:'Organic · Certified', name:'AL WASAT Organic', sub:'Organic Extra Virgin Olive Oil', price:'£16.99', unit:'/ 500ml', specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Certification',v:'EU Organic Certified'},{l:'Polyphenols',v:'460 mg/kg'},{l:'Acidity',v:'< 0.2%'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Format',v:'500ml glass bottle'}] },
  'organic-1l':   { nameKey:'home-p2-name', tagKey:'tag-organic', subKey:'p-sub-organic', tag:'Organic · Certified', name:'AL WASAT Organic', sub:'Organic Extra Virgin Olive Oil', price:'£28.99', unit:'/ 1 Litre', specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Certification',v:'EU Organic Certified'},{l:'Polyphenols',v:'460 mg/kg'},{l:'Acidity',v:'< 0.2%'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Format',v:'1 Litre glass bottle'}] },
  'tasting-250ml':    { nameKey:'pname-tasting', tagKey:'tag-tasting', subKey:'p-sub-tasting', tag:'Tasting',      name:'AL WASAT Classic — 250ml Tasting', sub:'Cold-pressed · Single origin · Tunisia', price:'£9.99',  unit:'/ 250ml',  specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Polyphenols',v:'520 mg/kg'},{l:'Acidity',v:'< 0.3%'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Format',v:'250ml glass bottle'}] },
  'bulk-3l':          { nameKey:'pname-bulk', tagKey:'tag-bulk', subKey:'p-sub-bulk', tag:'Bulk',         name:'AL WASAT Bulk — 3L Tin',           sub:'Trade & Hospitality Format',            price:'£49.99', unit:'/ 3L tin', specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Polyphenols',v:'490 mg/kg'},{l:'Acidity',v:'< 0.5%'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Format',v:'3 Litre tin'}] },
  'gift-box':         { nameKey:'home-p3-name', tagKey:'tag-giftbox', subKey:'p-sub-giftbox', tag:'Gift Box',     name:'AL WASAT Gift Box Set',     sub:'Two 250ml bottles · Luxury gift box',   price:'£24.99', unit:'/ set',    specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Includes',v:'2 × 250ml bottles, gift-boxed'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Delivery',v:'Free UK delivery included'},{l:'Format',v:'Luxury gift box'}] },
  'subscription-box': { nameKey:'name-sub', tagKey:'tag-subscribe', subKey:'p-sub-sub', tag:'Subscribe',    name:'Quarterly Subscription Box', sub:'Seasonal harvest selections, delivered', price:'£39.99', unit:'/ quarter', specs:[{l:'Frequency',v:'Quarterly delivery'},{l:'Contents',v:'Single harvest or blend, curated each season'},{l:'Flexibility',v:'Cancel anytime, no commitments'},{l:'Perks',v:'Members-only access to limited batches'},{l:'Format',v:'Subscription box, gift-wrapped'}] },
  'gift-card':        { nameKey:'pname-giftcard', tagKey:'tag-giftcard', subKey:'p-sub-giftcard', tag:'Gift Card',    name:'AL WASAT Digital Gift Card', sub:'Instant delivery by email',        price:'£15.00', unit:'/ card',   specs:[{l:'Delivery',v:'Instant — sent by email'},{l:'Validity',v:'12 months from purchase'},{l:'Redeemable',v:'Any product on al-wasat.co.uk'},{l:'Format',v:'Digital code, printable PDF included'}] },
};

/* === CART (global) === */
const _CK = 'alwasat_cart';

function getCart() {
  try {
    const raw = localStorage.getItem(_CK);
    const cart = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(cart)) return [];
    /* Only pid and qty are trusted from storage. Name, price and unit always
       come from PRODUCT_DATA, so a price change or edited storage can never
       show a stale total, and names follow the current language. */
    return cart.filter(i =>
      i && typeof i.pid === 'string' && i.pid in PRODUCT_DATA &&
      typeof i.qty === 'number' && Number.isInteger(i.qty) && i.qty > 0
    ).map(i => {
      const d = PRODUCT_DATA[i.pid];
      return { pid:i.pid, qty:i.qty, name:productName(i.pid), price:d.price, priceNum:parseFloat(d.price.replace('£','')), unit:d.unit };
    });
  } catch { return []; }
}

function productName(pid) {
  const d = PRODUCT_DATA[pid];
  return d ? awT(d.nameKey, d.name) : '';
}

function saveCart(c) {
  localStorage.setItem(_CK, JSON.stringify(c.map(i => ({ pid:i.pid, qty:i.qty }))));
  _cartBadge();
  _cartRender();
}

function addToCartById(pid, qty) {
  const d = PRODUCT_DATA[pid]; if (!d) return;
  const n = Math.max(1, Math.min(24, parseInt(qty, 10) || 1));
  const c = getCart();
  const x = c.find(i => i.pid === pid);
  if (x) x.qty += n; else c.push({ pid, qty:n });
  saveCart(c);
}

function cartQty(pid, delta) {
  const c = getCart(), x = c.find(i => i.pid === pid); if (!x) return;
  x.qty = Math.max(1, x.qty + delta); saveCart(c);
}

function cartRemove(pid) { saveCart(getCart().filter(i => i.pid !== pid)); }

function isMobileViewport() {
  return window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
}

/* Translate a runtime string. Falls back to English, then to the literal
   passed in, so JS-generated copy is never blank if the dictionary is absent. */
function awT(key, fallback) {
  var langs = window.I18N;
  var d = langs && langs[window._currentLang || 'en'];
  var v = d && d[key];
  if (v === undefined && langs && langs.en) v = langs.en[key];
  return v === undefined ? fallback : v;
}
window.awT = awT;

function showCartToast(message) {
  let toast = document.getElementById('cartToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cartToast';
    toast.className = 'cart-toast';
    toast.innerHTML = '<span></span><button type="button" onclick="openCart()"></button>';
    document.body.appendChild(toast);
  }
  toast.querySelector('button').textContent = awT('cart-view', 'View Cart');
  const label = toast.querySelector('span');
  if (label) label.textContent = message;
  toast.classList.add('show');
  clearTimeout(window._cartToastTimer);
  window._cartToastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* === DIALOG FOCUS ===
   The cart drawer and product modal are hidden off-screen, not removed, so
   they stay `inert` while closed (no tabbing into invisible controls). When
   open, Tab is kept inside and focus returns to the opener on close. */
let _dlgEl = null, _dlgReturn = null;
function _dlgKeys(e) {
  if (!_dlgEl || e.key !== 'Tab') return;
  const f = [..._dlgEl.querySelectorAll('a[href],button:not([disabled]),input,select,textarea')]
    .filter(el => el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
function _dlgOpen(el, focusEl) {
  _dlgReturn = document.activeElement;
  _dlgEl = el; el.inert = false;
  document.addEventListener('keydown', _dlgKeys);
  (focusEl || el).focus();
}
function _dlgClose(el) {
  el.inert = true;
  if (_dlgEl !== el) return;
  document.removeEventListener('keydown', _dlgKeys);
  _dlgEl = null;
  if (_dlgReturn && document.contains(_dlgReturn)) _dlgReturn.focus();
  _dlgReturn = null;
}

function openCart() {
  const dr = document.getElementById('cartDrawer'), ov = document.getElementById('cartOverlay');
  if (!dr) return;
  _cartRender();
  dr.classList.add('open'); ov.classList.add('open'); document.body.style.overflow = 'hidden';
  _dlgOpen(dr, document.getElementById('cartClose'));
}

function closeCart() {
  const dr = document.getElementById('cartDrawer'), ov = document.getElementById('cartOverlay');
  if (!dr || !dr.classList.contains('open')) return;
  dr.classList.remove('open'); ov.classList.remove('open'); document.body.style.overflow = '';
  _dlgClose(dr);
}

/* Cart lines store the English unit; show it in the current language. */
const _UNIT_KEYS = { '/ 1 Litre':'unit-litre', '/ 3L tin':'unit-tin', '/ set':'unit-set', '/ quarter':'unit-quarter', '/ card':'unit-card' };
function _unitLabel(u) { return _UNIT_KEYS[u] ? awT(_UNIT_KEYS[u], u) : u; }
const _SPEC_KEYS = { 'Origin':'spec-origin', 'Polyphenols':'poly-label', 'Acidity':'acid-label', 'Extraction':'spec-extraction', 'Format':'spec-format', 'Certification':'spec-cert' };

function _cartBadge() {
  const n = getCart().reduce((s,i) => s+i.qty, 0);
  document.querySelectorAll('.cart-count').forEach(el => { el.textContent = n; el.style.display = n ? '' : 'none'; });
}

function _cartRender() {
  const el = document.getElementById('cartItems'); if (!el) return;
  /* Re-rendering replaces the buttons; remember which one had focus. */
  const fk = el.contains(document.activeElement) ? document.activeElement.getAttribute('data-fk') : null;
  const refocus = () => {
    if (fk === null) return;
    const b = fk && el.querySelector('[data-fk="' + fk + '"]');
    (b || document.getElementById('cartClose') || el).focus();
  };
  const c = getCart(), foot = document.getElementById('cartFooter');
  if (!c.length) {
    el.innerHTML = '<div class="cd-empty"><p>' + awT('cart-empty', 'Your cart is empty.') +
      '</p><a href="/shop/" class="cd-empty-link">' + awT('cart-empty-link', 'Browse Collection') + ' →</a></div>';
    if (foot) foot.style.display = 'none'; refocus(); return;
  }
  if (foot) foot.style.display = '';
  const tot = c.reduce((s,i) => s+i.priceNum*i.qty, 0);
  el.innerHTML = c.map(i => `<div class="cd-item">
    <div class="cd-item-info">
      <div class="cd-item-name">${i.name}</div>
      <div class="cd-item-meta">${_unitLabel(i.unit).replace('/ ','')} · ${i.price} ${awT('cart-each', 'each')}</div>
      <div class="cd-item-price">£${(i.priceNum * i.qty).toFixed(2)}</div>
    </div>
    <div class="cd-item-right">
      <div class="cd-qty-row">
        <button class="cd-qty-btn" type="button" data-fk="${i.pid}:dec" aria-label="${awT('cart-qty-dec', 'Decrease quantity')}" onclick="cartQty('${i.pid}',-1)">−</button>
        <span class="cd-qty" aria-live="polite">${i.qty}</span>
        <button class="cd-qty-btn" type="button" data-fk="${i.pid}:inc" aria-label="${awT('cart-qty-inc', 'Increase quantity')}" onclick="cartQty('${i.pid}',1)">+</button>
      </div>
      <button class="cd-remove" type="button" aria-label="${awT('cart-remove', 'Remove')} ${i.name}" onclick="cartRemove('${i.pid}')">✕</button>
    </div>
  </div>`).join('');
  const totEl = document.getElementById('cartTotal'); if (totEl) totEl.textContent = '£'+tot.toFixed(2);
  if (typeof window._afterCartRender === 'function') window._afterCartRender();
  refocus();
}

/* === DOMContentLoaded === */
document.addEventListener('DOMContentLoaded', () => {

  /* Custom cursor removed — it added visual noise, hid the native affordance,
     and broke outright whenever this script failed to load. */

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

/* === PDP GALLERY DOTS ===
     The mobile product gallery is a scroll-snap row. Without a visible
     indicator it is undiscoverable, and there is no way to tell how many
     images exist. Dots are built from the actual images, so they stay
     correct if a product gains or loses a shot. */
  (function () {
    var media = document.querySelector('.pdp-media');
    if (!media) return;
    var imgs = media.querySelectorAll('img');
    if (imgs.length < 2) return;

    var dots = document.createElement('div');
    dots.className = 'pdp-dots';
    dots.setAttribute('role', 'tablist');
    dots.setAttribute('aria-label', 'Product images');
    imgs.forEach(function (img, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pdp-dot';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Image ' + (i + 1) + ' of ' + imgs.length);
      b.setAttribute('aria-current', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () {
        media.scrollTo({ left: img.offsetLeft - media.offsetLeft, behavior: 'smooth' });
      });
      dots.appendChild(b);
    });
    media.parentNode.insertBefore(dots, media.nextSibling);

    var all = dots.querySelectorAll('.pdp-dot');
    var tick;
    media.addEventListener('scroll', function () {
      clearTimeout(tick);
      tick = setTimeout(function () {
        var i = Math.round(media.scrollLeft / media.clientWidth);
        all.forEach(function (d, n) { d.setAttribute('aria-current', n === i ? 'true' : 'false'); });
      }, 60);
    }, { passive: true });
  })();

  /* === SCROLL REVEAL === */
  /* Reveal targets sit at opacity:0 (under html.js). If IntersectionObserver
     is unavailable, or the user prefers reduced motion, show everything at
     once rather than leaving the page blank. */
  const prefersReduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealAll = () =>
    document.querySelectorAll('.reveal,.p-card,.j-card').forEach(el => el.classList.add('in'));

  if (prefersReduce || typeof IntersectionObserver === 'undefined') {
    revealAll();
  } else {
    const revealObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
    /* Safety net: anything still hidden after 4s is shown regardless. */
    setTimeout(revealAll, 4000);
  }

  /* === CONTACT FORM (home only) === */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const FORM_ENDPOINT = '/.netlify/functions/contact';
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      let valid = true;
      this.querySelectorAll('[required]').forEach(field => {
        const wrap = field.closest('.field');
        const ok = field.value.trim() !== '' && (field.type !== 'email' || field.validity.valid);
        wrap.classList.toggle('has-error', !ok);
        if (!ok) valid = false;
      });
      if (!valid) return;
      const honeypot = this.querySelector('[name="_honeypot"]');
      if (honeypot && honeypot.value !== '') return;
      const btn = this.querySelector('.submit-btn');
      const label = btn.querySelector('span:first-child');
      btn.disabled = true; label.textContent = awT('form-sending', 'Sending…');
      try {
        const fd = new FormData(this);
        const body = {};
        fd.forEach((v, k) => { body[k] = v; });
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          this.style.display = 'none';
          document.getElementById('formSuccess').classList.add('show');
        } else {
          label.textContent = awT('form-retry', 'Try again'); btn.disabled = false;
        }
      } catch {
        label.textContent = awT('form-retry', 'Try again'); btn.disabled = false;
      }
    });
  }

  /* === UNRESOLVED PROOF LINKS ===
   Trust badges and press mentions carry a `data-verify` href. Until a real
   certificate / article URL is filled in, the href is a "#TODO..." stub.
   Strip those so the claim renders as plain, non-clickable text: a visitor
   must never be offered a proof link that leads nowhere. */
  document.querySelectorAll('a[data-verify]').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (href.indexOf('#TODO') === 0) {
      a.removeAttribute('href');
      a.removeAttribute('rel');
      if (a.classList.contains('trust-link')) a.remove();
    } else {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
  });

  /* === CART INIT === */
  _cartBadge();
  const cartDr = document.getElementById('cartDrawer');
  if (cartDr) {
    cartDr.setAttribute('role', 'dialog');
    cartDr.setAttribute('aria-modal', 'true');
    cartDr.setAttribute('aria-label', awT('cart-title', 'Your Selection'));
    cartDr.inert = true;
  }
  const cartCloseBtn = document.getElementById('cartClose');
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
  const cartOv = document.getElementById('cartOverlay');
  if (cartOv) cartOv.addEventListener('click', closeCart);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });

  /* === PRODUCT DETAIL MODAL (shop only) ===
     Products with their own page (data-url) always go to that page, on every
     screen size. The modal is only for products that do not have one yet. */
  const pdModal = document.getElementById('pdModal');
  if (pdModal) {
    const pdmClose = document.getElementById('pdmClose');
    const pdmBox = pdModal.querySelector('.pdm');
    pdmBox.setAttribute('role', 'dialog');
    pdmBox.setAttribute('aria-modal', 'true');
    pdmBox.setAttribute('aria-labelledby', 'pdmName');
    pdmClose.setAttribute('type', 'button');
    pdmClose.setAttribute('aria-label', awT('modal-close', 'Close'));
    pdModal.inert = true;

    function closePdm() {
      if (!pdModal.classList.contains('open')) return;
      pdModal.classList.remove('open'); document.body.style.overflow = '';
      _dlgClose(pdModal);
    }
    function showProduct(pid) {
      const d = PRODUCT_DATA[pid];
      if (!d) return;
      document.getElementById('pdmInner').innerHTML =
        `<div class="pdm-tag">${awT(d.tagKey, d.tag)}</div>
         <h2 class="pdm-name" id="pdmName">${productName(pid)}</h2>
         <div class="pdm-sub">${awT(d.subKey, d.sub)}</div>
         <div class="pdm-price">${d.price} <span class="pdm-price-lbl">${_unitLabel(d.unit)}</span></div>
         <div class="pdm-specs">${d.specs.map(s=>`<div class="pdm-spec"><div class="pdm-spec-label">${_SPEC_KEYS[s.l] ? awT(_SPEC_KEYS[s.l], s.l) : s.l}</div><div class="pdm-spec-val">${s.v}</div></div>`).join('')}</div>
         <button class="pdm-add-btn" type="button" id="pdmAdd">${awT('add-to-cart', 'Add to Cart')}</button>`;
      document.getElementById('pdmAdd').addEventListener('click', e => {
        e.stopPropagation();
        addToCartById(pid);
        const opener = _dlgReturn;
        closePdm();
        openCart();
        _dlgReturn = opener;   /* closing the cart returns focus to the card */
      });
      pdModal.classList.add('open');
      document.body.style.overflow = 'hidden';
      _dlgOpen(pdModal, pdmClose);
    }
    pdmClose.addEventListener('click', closePdm);
    pdModal.addEventListener('click', e => { if (e.target === pdModal) closePdm(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePdm(); });

    window['openDetails'] = function(e, el) {
      e.preventDefault(); e.stopPropagation();
      const card = el.closest('.p-card');
      if (card.dataset.url) { window.location.href = card.dataset.url; return; }
      showProduct(card.dataset.pid);
    };

    /* Deep link from elsewhere on the site: /shop/?product=gift-box */
    const linked = new URLSearchParams(location.search).get('product');
    if (linked && PRODUCT_DATA[linked]) showProduct(linked);
  }

  /* === ADD TO CART (shop only) === */
  window['addToCart'] = function(e, btn) {
    e.preventDefault(); e.stopPropagation();
    const card = btn.closest('.p-card');
    const pid = card.dataset.pid;
    addToCartById(pid);
    const orig = btn.textContent;
    btn.textContent = awT('added-to-cart', 'Added ✓'); btn.classList.add('added');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('added'); }, 1600);
    if (isMobileViewport()) {
      showCartToast(productName(pid) + ' ' + awT('cart-added-toast', 'added'));
    } else {
      openCart();
    }
  };

  /* === SHOP NOW (shop only) — add to cart + go to checkout === */
  window['shopNow'] = function(e, btn) {
    e.preventDefault(); e.stopPropagation();
    addToCartById(btn.closest('.p-card').dataset.pid);
    window.location.href = '/checkout/';
  };

  /* === HARVEST BANNER DISMISS (home only) === */
  (function(){
    const banner = document.getElementById('harvestBanner');
    const btn = document.getElementById('harvestClose');
    if (!banner || !btn) return;
    if (!localStorage.getItem('awHarvestDismissed')) {
      banner.style.display = 'flex';
      document.body.classList.add('has-banner');
    }
    btn.addEventListener('click', function(){
      banner.style.display = 'none';
      document.body.classList.remove('has-banner');
      localStorage.setItem('awHarvestDismissed', '1');
    });
  })();

  /* === PRODUCT CARDS + FILTER (shop only) === */
  const cards = document.querySelectorAll('.p-card');
  if (cards.length > 0) {
    if (prefersReduce || typeof IntersectionObserver === 'undefined') {
      cards.forEach(c => c.classList.add('in'));
    } else {
      const cardObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const i = Array.from(cards).indexOf(e.target);
            setTimeout(() => e.target.classList.add('in'), i * 120);
            cardObs.unobserve(e.target);
          }
        });
      }, { threshold: 0.1 });
      cards.forEach(c => cardObs.observe(c));
      setTimeout(() => cards.forEach(c => c.classList.add('in')), 4000);
    }

    function updateLastRow() {
      const vis = [...cards].filter(c => c.style.display !== 'none');
      cards.forEach(c => c.classList.remove('last-row'));
      const grid = document.getElementById('grid') || cards[0].parentElement;
      const cols = Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').length);
      const remainder = vis.length % cols;
      const count = remainder || Math.min(cols, vis.length);
      vis.slice(-count).forEach(c => c.classList.add('last-row'));
    }
    updateLastRow();
    /* Debounced: updateLastRow reads getComputedStyle, which forces layout.
       Running it on every resize event caused sustained jank while dragging. */
    var lastRowTimer;
    window.addEventListener('resize', function () {
      clearTimeout(lastRowTimer);
      lastRowTimer = setTimeout(updateLastRow, 150);
    }, { passive: true });

    window['filter'] = function(cat, btn) {
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');   /* state, not just colour */
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      cards.forEach(c => {
        const match = cat === 'all' || c.dataset.cat.includes(cat);
        c.style.display = match ? '' : 'none';
        if (match) c.classList.add('in');
      });
      updateLastRow();
    };
  }

});

/* ============================================================= */
/* === NEW ADDITIONS — Features 1–6                          === */
/* ============================================================= */

/* ============================================================= */
/* === LENIS SMOOTH SCROLL + GSAP PAGE TRANSITIONS           === */
/* ============================================================= */

/* === LENIS SMOOTH SCROLL === */
(function() {
  /* Native Chrome scrolling avoids a permanent RAF loop and lets compositor
     scrolling continue without waiting for the page's JavaScript thread. */
  if (_chromePerformance) return;
  if (typeof Lenis === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(max-width: 767px)').matches) return;
  /* Smooth-scroll hijacking is a vestibular trigger — leave native scrolling
     in place when the user has asked for reduced motion. */
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var lenis = new Lenis({
    duration: 1.2,
    easing: function(t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    smooth: true,
  });
  /* Pause when body overflow is locked (cart drawer / mobile nav open) */
  new MutationObserver(function(muts) {
    muts.forEach(function(m) {
      if (m.attributeName !== 'style') return;
      if (document.body.style.overflow === 'hidden') lenis.stop();
      else lenis.start();
    });
  }).observe(document.body, { attributes: true, attributeFilter: ['style'] });
  /* Run Lenis on every animation frame */
  (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
  window._lenis = lenis;

  /* Drive scroll-position effects through Lenis so they stay in sync with the RAF loop */
  lenis.on('scroll', function(e) {
    var scroll = e.scroll;
    var navEl = document.querySelector('nav');
    if (navEl) navEl.classList.toggle('scrolled', scroll > 60);
  });

  /* Anchor-link scrolling handled by Lenis (html scroll-behavior:auto set in CSS) */
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var hash = link.getAttribute('href');
    var target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -80, duration: 1.2 });
  });
})();

/* GSAP page transitions removed.
   They faded document.body on every load and delayed each internal
   navigation by 400ms. Because the tween is driven by requestAnimationFrame,
   a throttled or backgrounded tab could freeze it part-way and leave the
   whole page stuck semi-transparent (observed at opacity 0.77). GSAP had no
   other job on this site, so the CDN dependency is dropped entirely. */

/* === 5. STAT NUMBER COUNTER === */
(function(){
  const els = document.querySelectorAll('.stat-n');
  if (!els.length) return;
  const obs = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (!entry.isIntersecting) return;
      obs.unobserve(entry.target);
      const el = entry.target;
      const raw = el.textContent.trim();
      if (raw === '∞' || raw === '0') return;
      const suffix = raw.replace(/[0-9.]/g, '');
      const end = parseFloat(raw);
      if (isNaN(end)) return;
      const dur = 1800;
      const t0 = performance.now();
      (function tick(now){
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * end) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = raw;
      })(t0);
    });
  }, {threshold:0.6});
  els.forEach(function(el){ obs.observe(el); });
})();

/* === PRODUCT PAGE: quantity + add to cart === */
(function () {
  var add = document.querySelector('.pdp-add-btn[data-pid]');
  var qty = document.getElementById('pdpQty');
  if (!add || !qty) return;
  function clamp() { qty.value = Math.max(1, Math.min(24, parseInt(qty.value, 10) || 1)); }
  document.querySelectorAll('.pdp-qty [data-step]').forEach(function (b) {
    b.addEventListener('click', function () {
      qty.value = (parseInt(qty.value, 10) || 1) + parseInt(b.getAttribute('data-step'), 10);
      clamp();
    });
  });
  qty.addEventListener('change', clamp);
  add.addEventListener('click', function () {
    clamp();
    addToCartById(add.getAttribute('data-pid'), qty.value);
    qty.value = 1;
    openCart();
  });
})();

/* === LAZY BACKGROUND VIDEO ===
   Videos ship with preload="none" and only a poster frame. The file is
   fetched once the video is near the viewport — never on data-saver
   connections, under reduced motion, or when CSS hides the video (the shop
   video is display:none on phones). The poster stays as the still image. */
(function () {
  var vids = document.querySelectorAll('video[data-src]');
  if (!vids.length) return;
  var conn = navigator.connection || {};
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '') || reduce) return;

  function load(v) {
    if (getComputedStyle(v).display === 'none') return;
    if (v.hasAttribute('data-src')) {
      v.src = v.dataset.src;
      v.removeAttribute('data-src');
    }
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }
  if (typeof IntersectionObserver === 'undefined') { vids.forEach(load); return; }
  /* Chrome should decode the decorative video only while it can be seen.
     Keep observing after loading so leaving the section releases that work. */
  if (_chromePerformance) {
    var visible = new Set();
    function syncPlayback(v) {
      if (!document.hidden && visible.has(v)) load(v);
      else v.pause();
    }
    var playbackObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
        syncPlayback(e.target);
      });
    });
    vids.forEach(function (v) { playbackObs.observe(v); });
    document.addEventListener('visibilitychange', function () {
      vids.forEach(syncPlayback);
    });
    return;
  }
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { obs.unobserve(e.target); load(e.target); }
    });
  }, { rootMargin: '200px' });
  vids.forEach(function (v) { obs.observe(v); });
})();

// === NEWSLETTER ===
(function () {
  var form = document.querySelector('.newsletter-form');
  if (!form) return;
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var emailInput = form.querySelector('input[type="email"]');
    var btn = form.querySelector('.newsletter-btn');
    var email = emailInput ? emailInput.value.trim() : '';
    if (!email) return;
    btn.disabled = true;
    btn.innerHTML = '<span>' + awT('nl-joining', 'Joining…') + '</span>';
    try {
      var res = await fetch('/.netlify/functions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      });
      var data = await res.json();
      if (res.ok && data.ok) {
        form.style.display = 'none';
        var successEl = document.getElementById('newsletterSuccess');
        if (successEl) successEl.style.display = 'block';
      } else {
        throw new Error(data.error || 'Error');
      }
    } catch (_) {
      btn.disabled = false;
      btn.innerHTML = '<span>' + awT('nl-btn', 'Join') + '</span><span>&nbsp;→</span>';
      var errEl = form.querySelector('.nl-err');
      if (!errEl) {
        errEl = document.createElement('p');
        errEl.className = 'nl-err';
        errEl.setAttribute('role', 'alert');
        form.appendChild(errEl);
      }
      errEl.textContent = awT('nl-error', 'Something went wrong. Please try again.');
    }
  });
})();

// === COOKIE CONSENT BANNER ===
/* Google Analytics loads only after an explicit Accept (UK PECR). Until then
   no tag, no cookies, no request to Google. */
var GA_ID = 'G-TFTLQ2TYJV';
function loadAnalytics() {
  if (window._gaLoaded) return;
  window._gaLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', GA_ID);
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
}
try { if (localStorage.getItem('cookieConsent') === 'true') loadAnalytics(); } catch (e) {}

function acceptCookie() {
  localStorage.setItem('cookieConsent', 'true');
  loadAnalytics();
  var b = document.getElementById('cookieBanner');
  if (b) { b.classList.remove('visible'); setTimeout(function () { b.style.display = 'none'; }, 400); }
}
function declineCookie() {
  localStorage.setItem('cookieConsent', 'false');
  var b = document.getElementById('cookieBanner');
  if (b) { b.classList.remove('visible'); setTimeout(function () { b.style.display = 'none'; }, 400); }
}
document.addEventListener('DOMContentLoaded', function () {
  if (localStorage.getItem('cookieConsent')) return;
  var b = document.getElementById('cookieBanner');
  if (!b) return;
  b.style.display = 'flex';
  requestAnimationFrame(function () { b.classList.add('visible'); });
});

/* ================================================================= */
/* === LANGUAGE SWITCHING                                        === */
/* Dictionary lives in /assets/translations.js (window.I18N).        */
/*                                                                    */
/* Markup contract:                                                   */
/*   data-i18n="key"            -> sets textContent                   */
/*   data-i18n-html="key"       -> sets innerHTML (keys with markup)   */
/*   data-i18n-attr="a:key,..." -> sets attributes (placeholder, etc.) */
/* ================================================================= */

var AW_LANGS = ['en', 'fr', 'ar'];
var AW_LANG_KEY = 'alwasat_lang';

function awGetSavedLang() {
  try {
    var v = localStorage.getItem(AW_LANG_KEY);
    return AW_LANGS.indexOf(v) !== -1 ? v : 'en';
  } catch (e) { return 'en'; }
}

/* The Arabic face is fetched on demand — EN/FR visitors never pay for it.
   The pre-paint boot script in <head> does the same when AR is the stored
   language, so switching mid-session and loading straight into AR both work. */
function awEnsureArabicFont() {
  if (document.getElementById('aw-ar-font')) return;
  var k = document.createElement('link');
  k.id = 'aw-ar-font';
  k.rel = 'stylesheet';
  k.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600&display=swap';
  document.head.appendChild(k);
}

/* Reflect language on <html> and <body> and update the pill.
   Runs even when the dictionary failed to load, so direction, fonts and
   the active button never get stuck out of sync with the stored choice. */
function awSetLangState(lang) {
  var html = document.documentElement;
  var body = document.body;
  var isRtl = lang === 'ar';

  if (isRtl) awEnsureArabicFont();

  html.setAttribute('lang', lang);
  html.setAttribute('dir', isRtl ? 'rtl' : 'ltr');

  AW_LANGS.forEach(function (l) {
    html.classList.toggle('lang-' + l, l === lang);
    if (body) body.classList.toggle('lang-' + l, l === lang);
  });

  document.querySelectorAll('.lang-opt').forEach(function (btn) {
    var on = btn.getAttribute('data-lang') === lang;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });

  window._currentLang = lang;
}

function applyLanguage(lang, opts) {
  if (AW_LANGS.indexOf(lang) === -1) lang = 'en';

  awSetLangState(lang);

  if (!(opts && opts.skipPersist)) {
    try { localStorage.setItem(AW_LANG_KEY, lang); } catch (e) {}
  }

  var t = window.I18N && window.I18N[lang];
  if (!t) return;                       /* state is still correct without copy */
  var fallback = (window.I18N && window.I18N.en) || {};

  function lookup(key) {
    return t[key] !== undefined ? t[key] : fallback[key];
  }

  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var v = lookup(el.getAttribute('data-i18n'));
    if (v !== undefined) el.textContent = v;
  });

  document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
    var v = lookup(el.getAttribute('data-i18n-html'));
    if (v !== undefined) el.innerHTML = v;
  });

  document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
    el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
      var bits = pair.split(':');
      if (bits.length !== 2) return;
      var v = lookup(bits[1].trim());
      if (v !== undefined) el.setAttribute(bits[0].trim(), v);
    });
  });

  /* Re-render JS-generated regions so they pick up the new language */
  if (typeof _cartRender === 'function') { try { _cartRender(); } catch (e) {} }

  document.dispatchEvent(new CustomEvent('aw:languagechange', { detail: { lang: lang } }));
}

function initLanguage() {
  applyLanguage(awGetSavedLang(), { skipPersist: true });
}

/* Click handlers are bound immediately and do NOT wait on the dictionary.
   Previously they were attached inside translations.js `onload`, so a failed
   or blocked request left the buttons completely inert. */
(function bindLanguageButtons() {
  function bind() {
    document.querySelectorAll('.lang-opt').forEach(function (btn) {
      if (btn._awBound) return;
      btn._awBound = true;
      btn.setAttribute('type', 'button');
      btn.addEventListener('click', function () {
        applyLanguage(btn.getAttribute('data-lang'));
      });
    });
    /* Direction/font/active-state from storage, before copy arrives */
    awSetLangState(awGetSavedLang());
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();

/* Load the dictionary, then swap the copy in. */
(function loadTranslations() {
  if (window.I18N) { initLanguage(); return; }
  var s = document.createElement('script');
  s.src = '/assets/translations.js';
  s.onload = function () {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initLanguage);
    } else {
      initLanguage();
    }
  };
  s.onerror = function () {
    /* Copy stays in the HTML's default language — still fully usable. */
    if (window.console) console.warn('[i18n] translations.js failed to load; using inline copy.');
  };
  document.head.appendChild(s);
})();

/* === CHECKOUT PRICING SAFEGUARD ===
   Keep cart/checkout totals aligned with Stripe. Promotional codes are still
   allowed in Stripe Checkout, but local discount previews are intentionally
   disabled to avoid showing a lower total than the payment page. */
(function () {
  function resetLocalDiscountState() {
    localStorage.removeItem('alwasat_sub');
    localStorage.removeItem('alwasat_promo');
  }

  window._afterCartRender = function () {
    var foot = document.getElementById('cartFooter');
    if (!foot || foot.style.display === 'none') return;
    var promoEl = document.getElementById('cdPromoSection');
    if (!promoEl) {
      promoEl = document.createElement('div');
      promoEl.id = 'cdPromoSection';
      foot.insertBefore(promoEl, foot.firstChild);
    }
    promoEl.innerHTML = '<p class="cd-stripe-note">' + awT('cart-promo-note', 'Promo codes can be applied securely on the Stripe payment page.') + '</p>';
    var deliveryNote = document.getElementById('cdDeliveryNote');
    if (!deliveryNote) {
      deliveryNote = document.createElement('p');
      deliveryNote.id = 'cdDeliveryNote';
      deliveryNote.className = 'cd-delivery-note';
      foot.insertBefore(deliveryNote, promoEl.nextSibling);
    }
    deliveryNote.textContent = awT('cart-delivery-note', 'Delivery: 5–7 working days. Secure checkout by Stripe.');
    var totalRow = foot.querySelector('.cd-total-row');
    if (totalRow) {
      var badge = totalRow.querySelector('.cd-discount-badge');
      if (badge) badge.remove();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      resetLocalDiscountState();
      if (typeof _cartRender === 'function') _cartRender();
    });
  } else {
    resetLocalDiscountState();
    if (typeof _cartRender === 'function') _cartRender();
  }
})();
