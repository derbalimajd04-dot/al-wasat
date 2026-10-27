import './browser.js';
import { awT, unitLabel } from './copy.js';
import { PRODUCT_DATA } from './catalog.js';
import { getCart, saveCart, productName, addToCartById, cartQty, cartRemove, openCart, closeCart, initCart } from './cart.js';
import { initNavigation } from './navigation.js';
import { initProductGallery } from './product-gallery.js';
import { initScrollReveal, initSmoothScroll, initStatCounters, initBackgroundVideos } from './motion.js';
import { initContactForm, initNewsletter } from './forms.js';
import { initProofLinks, initHarvestBanner } from './site.js';
import { initShopProducts, initProductFilters, initProductPage } from './products.js';
import { acceptCookie, declineCookie, initCookieConsent } from './consent.js';
import { awGetSavedLang, awEnsureArabicFont, awSetLangState, applyLanguage, initLanguage, initLanguageControls } from './language.js';
import { initCheckoutSafeguard } from './checkout.js';

// Inline handlers and the checkout page retain their existing browser APIs.
Object.assign(window, {
  PRODUCT_DATA, awT, _unitLabel: unitLabel, getCart, saveCart, productName, addToCartById,
  cartQty, cartRemove, openCart, closeCart, acceptCookie, declineCookie,
  awGetSavedLang, awEnsureArabicFont, awSetLangState, applyLanguage, initLanguage
});

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initProductGallery();
  const prefersReduce = initScrollReveal();
  initContactForm();
  initProofLinks();
  initCart();
  initShopProducts();
  initHarvestBanner();
  initProductFilters(prefersReduce);
});

// Keep immediate setup in the same order as the original shared script.
initSmoothScroll();
initStatCounters();
initProductPage();
initBackgroundVideos();
initNewsletter();
initCookieConsent();
initLanguageControls();
initCheckoutSafeguard();
