import { awT } from './copy.js';
import { cartRender } from './cart.js';

export function initCheckoutSafeguard() {
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
      if (typeof cartRender === 'function') cartRender();
    });
  } else {
    resetLocalDiscountState();
    if (typeof cartRender === 'function') cartRender();
  }
})();
}
