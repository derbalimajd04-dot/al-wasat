export function initProofLinks() {
  /* === UNRESOLVED PROOF LINKS ===
   Trust badges and press mentions carry a `data-verify` href. Until a real
   certificate / article URL is filled in, the href is a "#TODO..." stub.
   Strip those so the claim renders as plain, non-clickable text: a visitor
   must never be offered a proof link that leads nowhere. */
  document.querySelectorAll('a[data-verify]').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (href.indexOf('#TODO') === 0) {
      a.removeAttribute('href');
      a.removeAttribute('rel');
      if (a.classList.contains('trust-link')) a.remove();
    } else {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

export function initHarvestBanner() {
  /* === HARVEST BANNER DISMISS (home only) === */
  (function(){
    const banner = document.getElementById('harvestBanner');
    const btn = document.getElementById('harvestClose');
    if (!banner || !btn) return;
    if (!localStorage.getItem('awHarvestDismissed')) {
      banner.style.display = 'flex';
      document.body.classList.add('has-banner');
    }
    btn.addEventListener('click', function(){
      banner.style.display = 'none';
      document.body.classList.remove('has-banner');
      localStorage.setItem('awHarvestDismissed', '1');
    });
  })();
}
