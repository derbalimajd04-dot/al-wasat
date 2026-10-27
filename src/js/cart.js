import { PRODUCT_DATA } from './catalog.js';
import { awT, unitLabel } from './copy.js';
import { openDialog, closeDialog } from './dialog.js';

/* === CART (global) === */
const _CK = 'alwasat_cart';

export function getCart() {
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

export function productName(pid) {
  const d = PRODUCT_DATA[pid];
  return d ? awT(d.nameKey, d.name) : '';
}

export function saveCart(c) {
  localStorage.setItem(_CK, JSON.stringify(c.map(i => ({ pid:i.pid, qty:i.qty }))));
  cartBadge();
  cartRender();
}

export function addToCartById(pid, qty) {
  const d = PRODUCT_DATA[pid]; if (!d) return;
  const n = Math.max(1, Math.min(24, parseInt(qty, 10) || 1));
  const c = getCart();
  const x = c.find(i => i.pid === pid);
  if (x) x.qty += n; else c.push({ pid, qty:n });
  saveCart(c);
}

export function cartQty(pid, delta) {
  const c = getCart(), x = c.find(i => i.pid === pid); if (!x) return;
  x.qty = Math.max(1, x.qty + delta); saveCart(c);
}

export function cartRemove(pid) { saveCart(getCart().filter(i => i.pid !== pid)); }

export function isMobileViewport() {
  return window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
}

export function showCartToast(message) {
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

export function openCart() {
  const dr = document.getElementById('cartDrawer'), ov = document.getElementById('cartOverlay');
  if (!dr) return;
  cartRender();
  dr.classList.add('open'); ov.classList.add('open'); document.body.style.overflow = 'hidden';
  openDialog(dr, document.getElementById('cartClose'));
}

export function closeCart() {
  const dr = document.getElementById('cartDrawer'), ov = document.getElementById('cartOverlay');
  if (!dr || !dr.classList.contains('open')) return;
  dr.classList.remove('open'); ov.classList.remove('open'); document.body.style.overflow = '';
  closeDialog(dr);
}

export function cartBadge() {
  const n = getCart().reduce((s,i) => s+i.qty, 0);
  document.querySelectorAll('.cart-count').forEach(el => { el.textContent = n; el.style.display = n ? '' : 'none'; });
}

export function cartRender() {
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
      <div class="cd-item-meta">${unitLabel(i.unit).replace('/ ','')} · ${i.price} ${awT('cart-each', 'each')}</div>
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


export function initCart() {
  /* === CART INIT === */
  cartBadge();
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
}
