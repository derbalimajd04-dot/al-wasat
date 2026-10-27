/* === DIALOG FOCUS ===
   The cart drawer and product modal are hidden off-screen, not removed, so
   they stay `inert` while closed (no tabbing into invisible controls). When
   open, Tab is kept inside and focus returns to the opener on close. */
let _dlgEl = null, _dlgReturn = null;
function _dlgKeys(e) {
  if (!_dlgEl || e.key !== 'Tab') return;
  const f = [..._dlgEl.querySelectorAll('a[href],button:not([disabled]),input,select,textarea')]
    .filter(el => el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
export function openDialog(el, focusEl) {
  _dlgReturn = document.activeElement;
  _dlgEl = el; el.inert = false;
  document.addEventListener('keydown', _dlgKeys);
  (focusEl || el).focus();
}
export function closeDialog(el) {
  el.inert = true;
  if (_dlgEl !== el) return;
  document.removeEventListener('keydown', _dlgKeys);
  _dlgEl = null;
  if (_dlgReturn && document.contains(_dlgReturn)) _dlgReturn.focus();
  _dlgReturn = null;
}


export function getDialogReturn() { return _dlgReturn; }
export function setDialogReturn(opener) { _dlgReturn = opener; }
