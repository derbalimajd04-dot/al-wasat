// === COOKIE CONSENT BANNER ===
/* Google Analytics loads only after an explicit Accept (UK PECR). Until then
   no tag, no cookies, no request to Google. */
var GA_ID = 'G-TFTLQ2TYJV';
export function loadAnalytics() {
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


export function acceptCookie() {
  localStorage.setItem('cookieConsent', 'true');
  loadAnalytics();
  var b = document.getElementById('cookieBanner');
  if (b) { b.classList.remove('visible'); setTimeout(function () { b.style.display = 'none'; }, 400); }
}
export function declineCookie() {
  localStorage.setItem('cookieConsent', 'false');
  var b = document.getElementById('cookieBanner');
  if (b) { b.classList.remove('visible'); setTimeout(function () { b.style.display = 'none'; }, 400); }
}

export function initCookieConsent() {
try { if (localStorage.getItem('cookieConsent') === 'true') loadAnalytics(); } catch (e) {}
document.addEventListener('DOMContentLoaded', function () {
  if (localStorage.getItem('cookieConsent')) return;
  var b = document.getElementById('cookieBanner');
  if (!b) return;
  b.style.display = 'flex';
  requestAnimationFrame(function () { b.classList.add('visible'); });
});
}
