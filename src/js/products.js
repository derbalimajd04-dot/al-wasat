import { PRODUCT_DATA } from './catalog.js';
import { awT, unitLabel, SPEC_KEYS } from './copy.js';
import { addToCartById, productName, openCart, isMobileViewport, showCartToast } from './cart.js';
import { openDialog, closeDialog, getDialogReturn, setDialogReturn } from './dialog.js';

export function initShopProducts() {
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
      closeDialog(pdModal);
    }
    function showProduct(pid) {
      const d = PRODUCT_DATA[pid];
      if (!d) return;
      document.getElementById('pdmInner').innerHTML =
        `<div class="pdm-tag">${awT(d.tagKey, d.tag)}</div>
         <h2 class="pdm-name" id="pdmName">${productName(pid)}</h2>
         <div class="pdm-sub">${awT(d.subKey, d.sub)}</div>
         <div class="pdm-price">${d.price} <span class="pdm-price-lbl">${unitLabel(d.unit)}</span></div>
         <div class="pdm-specs">${d.specs.map(s=>`<div class="pdm-spec"><div class="pdm-spec-label">${SPEC_KEYS[s.l] ? awT(SPEC_KEYS[s.l], s.l) : s.l}</div><div class="pdm-spec-val">${s.v}</div></div>`).join('')}</div>
         <button class="pdm-add-btn" type="button" id="pdmAdd">${awT('add-to-cart', 'Add to Cart')}</button>`;
      document.getElementById('pdmAdd').addEventListener('click', e => {
        e.stopPropagation();
        addToCartById(pid);
        const opener = getDialogReturn();
        closePdm();
        openCart();
        setDialogReturn(opener);   /* closing the cart returns focus to the card */
      });
      pdModal.classList.add('open');
      document.body.style.overflow = 'hidden';
      openDialog(pdModal, pdmClose);
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

}

export function initProductFilters(prefersReduce) {
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
}

export function initProductPage() {
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
}
