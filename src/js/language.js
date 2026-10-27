import { cartRender } from './cart.js';

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

export function awGetSavedLang() {
  try {
    var v = localStorage.getItem(AW_LANG_KEY);
    return AW_LANGS.indexOf(v) !== -1 ? v : 'en';
  } catch (e) { return 'en'; }
}

/* The Arabic face is fetched on demand — EN/FR visitors never pay for it.
   The pre-paint boot script in <head> does the same when AR is the stored
   language, so switching mid-session and loading straight into AR both work. */
export function awEnsureArabicFont() {
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
export function awSetLangState(lang) {
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

export function applyLanguage(lang, opts) {
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
  if (typeof cartRender === 'function') { try { cartRender(); } catch (e) {} }

  document.dispatchEvent(new CustomEvent('aw:languagechange', { detail: { lang: lang } }));
}

export function initLanguage() {
  applyLanguage(awGetSavedLang(), { skipPersist: true });
}

export function initLanguageControls() {
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


}
