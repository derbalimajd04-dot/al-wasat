/* === PRODUCT DATA (global — used by modal + cart) === */
const PRODUCT_DATA = {
  'classic-500':  { tag:'Classic', name:'AL WASAT Classic', sub:'Extra Virgin Olive Oil', price:'£13.99', unit:'/ 500ml', specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Acidity',v:'< 0.8%'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Harvest',v:'October – November'},{l:'Format',v:'500ml glass bottle'}] },
  'classic-1l':   { tag:'Classic', name:'AL WASAT Classic', sub:'Extra Virgin Olive Oil', price:'£22.99', unit:'/ 1 Litre', specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Acidity',v:'< 0.8%'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Harvest',v:'October – November'},{l:'Format',v:'1 Litre glass bottle'}] },
  'organic-500':  { tag:'Organic · Certified', name:'AL WASAT Organic', sub:'Organic Extra Virgin Olive Oil', price:'£16.99', unit:'/ 500ml', specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Certification',v:'EU Organic Certified'},{l:'Acidity',v:'< 0.6%'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Format',v:'500ml glass bottle'}] },
  'organic-1l':   { tag:'Organic · Certified', name:'AL WASAT Organic', sub:'Organic Extra Virgin Olive Oil', price:'£28.99', unit:'/ 1 Litre', specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Certification',v:'EU Organic Certified'},{l:'Acidity',v:'< 0.6%'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Format',v:'1 Litre glass bottle'}] }
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
      vis.slice(-2).forEach(c => c.classList.add('last-row'));
    }
    updateLastRow();

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
