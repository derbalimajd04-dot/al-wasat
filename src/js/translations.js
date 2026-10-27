/* AL WASAT — i18n dictionary
   Keys are referenced from markup via data-i18n="key" (textContent)
   or data-i18n-html="key" (innerHTML, for keys containing markup).
   data-i18n-attr="attr:key,attr:key" sets attributes (placeholder, aria-label…).

   Coverage: navigation, hero, homepage sections, cart, checkout chrome,
   forms, footer, cookie banner. Journal article bodies and legal pages
   remain English-only by design — they are long-form legal/editorial copy. */
import en from './locales/en.js';
import fr from './locales/fr.js';
import ar from './locales/ar.js';

window.I18N = { en, fr, ar };
