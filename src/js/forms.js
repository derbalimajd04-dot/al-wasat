import { awT } from './copy.js';

export function initContactForm() {
  /* === CONTACT FORM (home only) === */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const FORM_ENDPOINT = '/.netlify/functions/contact';
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      let valid = true;
      this.querySelectorAll('[required]').forEach(field => {
        const wrap = field.closest('.field');
        const ok = field.value.trim() !== '' && (field.type !== 'email' || field.validity.valid);
        wrap.classList.toggle('has-error', !ok);
        if (!ok) valid = false;
      });
      if (!valid) return;
      const honeypot = this.querySelector('[name="_honeypot"]');
      if (honeypot && honeypot.value !== '') return;
      const btn = this.querySelector('.submit-btn');
      const label = btn.querySelector('span:first-child');
      btn.disabled = true; label.textContent = awT('form-sending', 'Sending…');
      try {
        const fd = new FormData(this);
        const body = {};
        fd.forEach((v, k) => { body[k] = v; });
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          this.style.display = 'none';
          document.getElementById('formSuccess').classList.add('show');
        } else {
          label.textContent = awT('form-retry', 'Try again'); btn.disabled = false;
        }
      } catch {
        label.textContent = awT('form-retry', 'Try again'); btn.disabled = false;
      }
    });
  }
}

export function initNewsletter() {
// === NEWSLETTER ===
(function () {
  var form = document.querySelector('.newsletter-form');
  if (!form) return;
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var emailInput = form.querySelector('input[type="email"]');
    var btn = form.querySelector('.newsletter-btn');
    var email = emailInput ? emailInput.value.trim() : '';
    if (!email) return;
    btn.disabled = true;
    btn.innerHTML = '<span>' + awT('nl-joining', 'Joining…') + '</span>';
    try {
      var res = await fetch('/.netlify/functions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      });
      var data = await res.json();
      if (res.ok && data.ok) {
        form.style.display = 'none';
        var successEl = document.getElementById('newsletterSuccess');
        if (successEl) successEl.style.display = 'block';
      } else {
        throw new Error(data.error || 'Error');
      }
    } catch (_) {
      btn.disabled = false;
      btn.innerHTML = '<span>' + awT('nl-btn', 'Join') + '</span><span>&nbsp;→</span>';
      var errEl = form.querySelector('.nl-err');
      if (!errEl) {
        errEl = document.createElement('p');
        errEl.className = 'nl-err';
        errEl.setAttribute('role', 'alert');
        form.appendChild(errEl);
      }
      errEl.textContent = awT('nl-error', 'Something went wrong. Please try again.');
    }
  });
})();
}
