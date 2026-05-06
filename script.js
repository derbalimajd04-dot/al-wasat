/* === PRODUCT DATA (global — used by modal + cart) === */
const PRODUCT_DATA = {
  'classic-500':  { tag:'Classic', name:'AL WASAT Classic', sub:'Extra Virgin Olive Oil', price:'£13.99', unit:'/ 500ml', specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Acidity',v:'< 0.8%'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Harvest',v:'October – November'},{l:'Format',v:'500ml glass bottle'}] },
  'classic-1l':   { tag:'Classic', name:'AL WASAT Classic', sub:'Extra Virgin Olive Oil', price:'£22.99', unit:'/ 1 Litre', specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Acidity',v:'< 0.8%'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Harvest',v:'October – November'},{l:'Format',v:'1 Litre glass bottle'}] },
  'organic-500':  { tag:'Organic · Certified', name:'AL WASAT Organic', sub:'Organic Extra Virgin Olive Oil', price:'£16.99', unit:'/ 500ml', specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Certification',v:'EU Organic Certified'},{l:'Acidity',v:'< 0.6%'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Format',v:'500ml glass bottle'}] },
  'organic-1l':   { tag:'Organic · Certified', name:'AL WASAT Organic', sub:'Organic Extra Virgin Olive Oil', price:'£28.99', unit:'/ 1 Litre', specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Certification',v:'EU Organic Certified'},{l:'Acidity',v:'< 0.6%'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Format',v:'1 Litre glass bottle'}] },
  'gift-set':            { tag:'Gift Set', name:'AL WASAT Gift Set', sub:'Classic & Organic 500ml', price:'£27.99', unit:'/ bundle', specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Includes',v:'Classic 500ml + Organic 500ml'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Harvest',v:'October – November'},{l:'Format',v:'Two-bottle gift set, boxed'}] }
};

/* === CART (global) === */
const _CK = 'alwasat_cart';

function getCart() {
  try {
    const raw = localStorage.getItem(_CK);
    const cart = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(cart)) return [];
    return cart.filter(i =>
      i && typeof i.pid === 'string' && i.pid in PRODUCT_DATA &&
      typeof i.qty === 'number' && Number.isInteger(i.qty) && i.qty > 0
    );
  } catch { return []; }
}

function saveCart(c) {
  localStorage.setItem(_CK, JSON.stringify(c));
  _cartBadge();
  _cartRender();
}

function addToCartById(pid) {
  const d = PRODUCT_DATA[pid]; if (!d) return;
  const c = getCart();
  const x = c.find(i => i.pid === pid);
  if (x) x.qty++; else c.push({ pid, name:d.name, price:d.price, priceNum:parseFloat(d.price.replace('£','')), unit:d.unit, qty:1 });
  saveCart(c);
}

function cartQty(pid, delta) {
  const c = getCart(), x = c.find(i => i.pid === pid); if (!x) return;
  x.qty = Math.max(1, x.qty + delta); saveCart(c);
}

function cartRemove(pid) { saveCart(getCart().filter(i => i.pid !== pid)); }

function openCart() {
  const dr = document.getElementById('cartDrawer'), ov = document.getElementById('cartOverlay');
  if (!dr) return;
  _cartRender();
  dr.classList.add('open'); ov.classList.add('open'); document.body.style.overflow = 'hidden';
}

function closeCart() {
  const dr = document.getElementById('cartDrawer'), ov = document.getElementById('cartOverlay');
  if (!dr) return;
  dr.classList.remove('open'); ov.classList.remove('open'); document.body.style.overflow = '';
}

function _cartBadge() {
  const n = getCart().reduce((s,i) => s+i.qty, 0);
  document.querySelectorAll('.cart-count').forEach(el => { el.textContent = n; el.style.display = n ? '' : 'none'; });
}

function _cartRender() {
  const el = document.getElementById('cartItems'); if (!el) return;
  const c = getCart(), foot = document.getElementById('cartFooter');
  if (!c.length) {
    el.innerHTML = '<div class="cd-empty"><p>Your cart is empty.</p><a href="/shop/" class="cd-empty-link">Browse Collection →</a></div>';
    if (foot) foot.style.display = 'none'; return;
  }
  if (foot) foot.style.display = '';
  const tot = c.reduce((s,i) => s+i.priceNum*i.qty, 0);
  el.innerHTML = c.map(i => `<div class="cd-item">
    <div class="cd-item-info">
      <div class="cd-item-name">${i.name}</div>
      <div class="cd-item-meta">${i.unit.replace('/ ','')} · ${i.price} each</div>
      <div class="cd-item-price">£${(i.priceNum * i.qty).toFixed(2)}</div>
    </div>
    <div class="cd-item-right">
      <div class="cd-qty-row">
        <button class="cd-qty-btn" onclick="cartQty('${i.pid}',-1)">−</button>
        <span class="cd-qty">${i.qty}</span>
        <button class="cd-qty-btn" onclick="cartQty('${i.pid}',1)">+</button>
      </div>
      <button class="cd-remove" onclick="cartRemove('${i.pid}')">✕</button>
    </div>
  </div>`).join('');
  const totEl = document.getElementById('cartTotal'); if (totEl) totEl.textContent = '£'+tot.toFixed(2);
  if (typeof window._afterCartRender === 'function') window._afterCartRender();
}

/* === DOMContentLoaded === */
document.addEventListener('DOMContentLoaded', () => {

  /* === CURSOR === */
  const dot = document.getElementById('curDot');
  const ring = document.getElementById('curRing');
  if (dot && ring) {
    let mx = -100, my = -100, rx = -100, ry = -100;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
    });
    document.addEventListener('mouseover', e => {
      if (e.target.closest('a,.p-card,button')) ring.classList.add('hover');
    });
    document.addEventListener('mouseout', e => {
      if (!e.relatedTarget || !e.relatedTarget.closest('a,.p-card,button')) ring.classList.remove('hover');
    });
    (function lagRing() {
      rx += (mx - rx) * 0.1; ry += (my - ry) * 0.1;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(lagRing);
    })();
  }

  /* === NAV SCROLL STATE (home transparent nav) === */
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 60));
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

  /* === SCROLL REVEAL === */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  /* === PRELOADER (home only) === */
  const preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', () => setTimeout(() => preloader.classList.add('out'), 2100));
  }

  /* === HERO PARALLAX (home only) === */
  const heroWrap = document.querySelector('.hero-video-wrap');
  if (heroWrap) {
    window.addEventListener('scroll', () => {
      heroWrap.style.transform = `translateY(${window.scrollY * 0.025}px)`;
    });
  }

  /* === CONTACT FORM (home only) === */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    // Replace YOUR_FORM_ID with your Formspree endpoint ID (formspree.io)
    const FORM_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';
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
      if (this._honeypot && this._honeypot.value !== '') return;
      const btn = this.querySelector('.submit-btn');
      const label = btn.querySelector('span:first-child');
      btn.disabled = true; label.textContent = 'Sending…';
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(this)
        });
        if (res.ok) {
          this.style.display = 'none';
          document.getElementById('formSuccess').classList.add('show');
        } else {
          label.textContent = 'Try again'; btn.disabled = false;
        }
      } catch {
        label.textContent = 'Try again'; btn.disabled = false;
      }
    });
  }

  /* === CART INIT === */
  _cartBadge();
  const cartCloseBtn = document.getElementById('cartClose');
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
  const cartOv = document.getElementById('cartOverlay');
  if (cartOv) cartOv.addEventListener('click', closeCart);

  /* === STICKY SHOP CTA === */
  (function(){
    if (window.location.pathname.indexOf('/checkout/') === 0) return;
    const cta = document.createElement('div');
    cta.className = 'sticky-shop-cta';
    cta.innerHTML = '<a class="sticky-shop-cta-link" href="/shop/" aria-label="Shop AL WASAT Classic for £13.99">AL WASAT Classic — £13.99 · Shop Now</a>';
    document.body.appendChild(cta);

    function updateStickyCta() {
      cta.classList.toggle('is-visible', window.scrollY > 600);
    }

    updateStickyCta();
    window.addEventListener('scroll', updateStickyCta, { passive: true });
  })();

  /* === PRODUCT DETAIL MODAL (shop only) === */
  const pdModal = document.getElementById('pdModal');
  if (pdModal) {
    const pdmClose = document.getElementById('pdmClose');
    function closePdm() { pdModal.classList.remove('open'); document.body.style.overflow = ''; }
    pdmClose.addEventListener('click', closePdm);
    pdModal.addEventListener('click', e => { if (e.target === pdModal) closePdm(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closePdm(); closeCart(); } });
    window['openDetails'] = function(e, btn) {
      e.preventDefault(); e.stopPropagation();
      const pid = btn.closest('.p-card').dataset.pid;
      const d = PRODUCT_DATA[pid];
      if (!d) return;
      document.getElementById('pdmInner').innerHTML =
        `<div class="pdm-tag">${d.tag}</div>
         <div class="pdm-name">${d.name}</div>
         <div class="pdm-sub">${d.sub}</div>
         <div class="pdm-price">${d.price} <span class="pdm-price-lbl">${d.unit}</span></div>
         <div class="pdm-specs">${d.specs.map(s=>`<div class="pdm-spec"><div class="pdm-spec-label">${s.l}</div><div class="pdm-spec-val">${s.v}</div></div>`).join('')}</div>
         <button class="pdm-add-btn" onclick="event.stopPropagation();addToCartById('${pid}');document.getElementById('pdModal').classList.remove('open');document.body.style.overflow='';openCart();">Add to Cart</button>`;
      pdModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
  }

  /* === ADD TO CART (shop only) === */
  window['addToCart'] = function(e, btn) {
    e.preventDefault(); e.stopPropagation();
    const pid = btn.closest('.p-card').dataset.pid;
    addToCartById(pid);
    const orig = btn.textContent;
    btn.textContent = 'Added ✓'; btn.classList.add('added');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('added'); }, 1600);
    openCart();
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
    window.addEventListener('resize', updateLastRow);

    window['filter'] = function(cat, btn) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
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
  if (typeof Lenis === 'undefined') return;
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

/* === GSAP PAGE TRANSITIONS === */
(function() {
  if (typeof gsap === 'undefined') return;

  /* Fade + slide up on page load */
  document.addEventListener('DOMContentLoaded', function() {
    gsap.from(document.body, { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out', clearProps: 'all' });
  });

  /* Restore correctly when navigating via browser back / forward (bfcache) */
  window.addEventListener('pageshow', function(e) {
    if (!e.persisted) return;
    gsap.fromTo(document.body,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'all' }
    );
  });

  /* Intercept internal <a> clicks — animate page out then navigate */
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    /* Skip: anchors, special protocols, new-tab, modifier keys */
    if (!href || href.charAt(0) === '#') return;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
    if (link.target === '_blank') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    /* Skip: external origins */
    try {
      var url = new URL(href, window.location.href);
      if (url.hostname !== window.location.hostname) return;
    } catch(_) { return; }

    e.preventDefault();
    var dest = link.href;
    if (window._lenis) window._lenis.stop();
    gsap.to(document.body, {
      opacity: 0, y: -20, duration: 0.4, ease: 'power2.in',
      onComplete: function() { window.location.href = dest; }
    });
  });
})();

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

/* ============================================================= */
/* === SUBSCRIPTION MODE                                      === */
/* ============================================================= */
(function () {
  var SUB_DISCOUNT = 0.10;

  window._subMode = localStorage.getItem('alwasat_sub') === '1';

  function setSubMode(on) {
    window._subMode = on;
    localStorage.setItem('alwasat_sub', on ? '1' : '0');
    _updateShopPrices();
    _cartRender(); // refresh cart totals
  }

  function _updateShopPrices() {
    var cards = document.querySelectorAll('.p-card');
    cards.forEach(function (card) {
      var priceEl = card.querySelector('.p-price');
      if (!priceEl) return;
      var base = parseFloat(priceEl.dataset.base);
      if (isNaN(base)) return;
      var displayed = window._subMode ? (base * (1 - SUB_DISCOUNT)).toFixed(2) : base.toFixed(2);
      var label = priceEl.querySelector('.p-price-label');
      priceEl.innerHTML = '£' + displayed + (label ? ' <span class="p-price-label">' + label.textContent + '</span>' : '');
      priceEl.dataset.base = base; // preserve original
    });
    // Toggle active class on the toggle option labels
    var optOne = document.getElementById('subOptOne');
    var optSub = document.getElementById('subOptSub');
    if (optOne) optOne.classList.toggle('active', !window._subMode);
    if (optSub) optSub.classList.toggle('active', window._subMode);
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Wire toggle button
    var btn = document.getElementById('subToggleBtn');
    if (btn) {
      // Restore state
      if (window._subMode) btn.setAttribute('aria-checked', 'true');
      btn.classList.toggle('on', window._subMode);
      _updateShopPrices();

      btn.addEventListener('click', function () {
        var next = !(window._subMode);
        btn.setAttribute('aria-checked', next ? 'true' : 'false');
        btn.classList.toggle('on', next);
        setSubMode(next);
      });
    }
  });
})();

/* ============================================================= */
/* === PROMO CODE                                             === */
/* ============================================================= */
(function () {
  window._promoState = JSON.parse(localStorage.getItem('alwasat_promo') || 'null');

  function savePromo(state) {
    window._promoState = state;
    if (state) localStorage.setItem('alwasat_promo', JSON.stringify(state));
    else localStorage.removeItem('alwasat_promo');
    _cartRender();
  }

  window._getPromoCode  = function () { return window._promoState ? window._promoState.code : ''; };
  window._clearPromoCode = function () { savePromo(null); };

  window._applyPromoCode = async function (code) {
    if (!code) return null;
    try {
      var res  = await fetch('/.netlify/functions/validate-promo?code=' + encodeURIComponent(code));
      var data = await res.json();
      if (data.valid) { savePromo({ code: data.code, pct: data.pct, label: data.label }); return data; }
      savePromo(null); return null;
    } catch (_) { return null; }
  };

  // _afterCartRender is called at the end of _cartRender() via the hook added above
  window._afterCartRender = function () {
    var foot = document.getElementById('cartFooter');
    if (!foot || foot.style.display === 'none') return;

    // Ensure promo section exists inside footer
    var promoEl = document.getElementById('cdPromoSection');
    if (!promoEl) {
      promoEl = document.createElement('div');
      promoEl.id = 'cdPromoSection';
      foot.insertBefore(promoEl, foot.firstChild);
    }

    var promo = window._promoState;
    var sub   = window._subMode;

    if (promo) {
      promoEl.innerHTML =
        '<div class="cd-promo-applied">' +
          '<span class="cd-promo-code">' + promo.code + '</span>' +
          '<span class="cd-promo-label">' + promo.label + '</span>' +
          '<button class="cd-promo-remove" aria-label="Remove promo code" onclick="window._clearPromoCode()">&#x2715;</button>' +
        '</div>';
    } else {
      promoEl.innerHTML =
        '<div class="cd-promo-row">' +
          '<input class="cd-promo-input" id="cdPromoInput" type="text" placeholder="Promo code" autocomplete="off" autocapitalize="characters">' +
          '<button class="cd-promo-apply" id="cdPromoApply">Apply</button>' +
        '</div>' +
        '<div class="cd-promo-msg" id="cdPromoMsg"></div>';

      var applyBtn = document.getElementById('cdPromoApply');
      if (applyBtn) {
        applyBtn.addEventListener('click', async function () {
          var inp    = document.getElementById('cdPromoInput');
          var msg    = document.getElementById('cdPromoMsg');
          var code   = inp ? inp.value.trim() : '';
          if (!code) return;
          applyBtn.disabled = true; applyBtn.textContent = '…';
          var result = await window._applyPromoCode(code);
          if (!result) {
            if (msg) { msg.textContent = 'Code not recognised.'; msg.className = 'cd-promo-msg err'; }
            applyBtn.disabled = false; applyBtn.textContent = 'Apply';
          }
          // On success savePromo calls _cartRender which re-runs this hook
        });
      }
    }

    // Recalculate total with stacked discounts
    var subMult   = sub   ? 0.90 : 1;
    var promoMult = promo ? (1 - promo.pct / 100) : 1;
    var combined  = subMult * promoMult;

    var totalRow = foot.querySelector('.cd-total-row');
    if (combined < 1) {
      var base  = getCart().reduce(function (s, i) { return s + i.priceNum * i.qty; }, 0);
      var totEl = document.getElementById('cartTotal');
      if (totEl) totEl.textContent = '£' + (base * combined).toFixed(2);

      if (totalRow) {
        var badge = totalRow.querySelector('.cd-discount-badge');
        if (!badge) { badge = document.createElement('span'); badge.className = 'cd-discount-badge'; totalRow.appendChild(badge); }
        var parts = [];
        if (sub)   parts.push('Sub −10%');
        if (promo) parts.push(promo.code + ' −' + promo.pct + '%');
        badge.textContent = parts.join(' · ');
      }
    } else {
      if (totalRow) { var b2 = totalRow.querySelector('.cd-discount-badge'); if (b2) b2.remove(); }
    }
  };
})();
