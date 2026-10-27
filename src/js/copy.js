/* Translate a runtime string. Falls back to English, then to the literal
   passed in, so JS-generated copy is never blank if the dictionary is absent. */
export function awT(key, fallback) {
  var langs = window.I18N;
  var d = langs && langs[window._currentLang || 'en'];
  var v = d && d[key];
  if (v === undefined && langs && langs.en) v = langs.en[key];
  return v === undefined ? fallback : v;
}


/* Cart lines store the English unit; show it in the current language. */
const _UNIT_KEYS = { '/ 1 Litre':'unit-litre', '/ 3L tin':'unit-tin', '/ set':'unit-set', '/ quarter':'unit-quarter', '/ card':'unit-card' };
export function unitLabel(u) { return _UNIT_KEYS[u] ? awT(_UNIT_KEYS[u], u) : u; }
export const SPEC_KEYS = { 'Origin':'spec-origin', 'Polyphenols':'poly-label', 'Acidity':'acid-label', 'Extraction':'spec-extraction', 'Format':'spec-format', 'Certification':'spec-cert' };
