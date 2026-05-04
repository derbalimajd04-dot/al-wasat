document.addEventListener('DOMContentLoaded', () => {

  /* === CURSOR === */
  const dot = document.getElementById('curDot');
  const ring = document.getElementById('curRing');
  if (dot && ring) {
    let mx = -100, my = -100, rx = -100, ry = -100;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
    });
    document.addEventListener('mouseover', e => {
      if (e.target.closest('a,.p-card,button')) ring.classList.add('hover');
    });
    document.addEventListener('mouseout', e => {
      if (!e.relatedTarget || !e.relatedTarget.closest('a,.p-card,button')) ring.classList.remove('hover');
    });
    (function lagRing() {
      rx += (mx - rx) * 0.1; ry += (my - ry) * 0.1;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(lagRing);
    })();
  }

  /* === NAV SCROLL STATE (home transparent nav) === */
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 60));
  }

  /* === MOBILE HAMBURGER === */
  const ham = document.getElementById('navHam');
  const navLinks = document.getElementById('navLinks');
  const overlay = document.getElementById('navOverlay');
  if (ham && navLinks && overlay) {
    function toggleNav(open) {
      ham.classList.toggle('open', open);
      navLinks.classList.toggle('open', open);
      overlay.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      ham.setAttribute('aria-expanded', open);
    }
    ham.addEventListener('click', () => toggleNav(!ham.classList.contains('open')));
    overlay.addEventListener('click', () => toggleNav(false));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleNav(false)));
  }

  /* === SCROLL REVEAL === */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  /* === PRELOADER (home only) === */
  const preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', () => setTimeout(() => preloader.classList.add('out'), 2100));
  }

  /* === HERO PARALLAX (home only) === */
  const heroWrap = document.querySelector('.hero-video-wrap');
  if (heroWrap) {
    window.addEventListener('scroll', () => {
      heroWrap.style.transform = `translateY(${window.scrollY * 0.025}px)`;
    });
  }

  /* === CONTACT FORM (home only) === */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    // Replace YOUR_FORM_ID with your Formspree endpoint ID (formspree.io)
    const FORM_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';
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
      const btn = this.querySelector('.submit-btn');
      const label = btn.querySelector('span:first-child');
      btn.disabled = true; label.textContent = 'Sending…';
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(this)
        });
        if (res.ok) {
          this.style.display = 'none';
          document.getElementById('formSuccess').classList.add('show');
        } else {
          label.textContent = 'Try again'; btn.disabled = false;
        }
      } catch {
        label.textContent = 'Try again'; btn.disabled = false;
      }
    });
  }

  /* === PRODUCT DETAIL MODAL (shop only) === */
  const PRODUCT_DATA = {
    'classic-500':  { tag:'Classic', name:'AL WASAT Classic', sub:'Extra Virgin Olive Oil', price:'£13.99', unit:'/ 500ml', specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Acidity',v:'< 0.8%'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Harvest',v:'October – November'},{l:'Format',v:'500ml glass bottle'}] },
    'classic-1l':   { tag:'Classic', name:'AL WASAT Classic', sub:'Extra Virgin Olive Oil', price:'£22.99', unit:'/ 1 Litre', specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Acidity',v:'< 0.8%'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Harvest',v:'October – November'},{l:'Format',v:'1 Litre glass bottle'}] },
    'organic-500':  { tag:'Organic · Certified', name:'AL WASAT Organic', sub:'Organic Extra Virgin Olive Oil', price:'£16.99', unit:'/ 500ml', specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Certification',v:'EU Organic Certified'},{l:'Acidity',v:'< 0.6%'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Format',v:'500ml glass bottle'}] },
    'organic-1l':   { tag:'Organic · Certified', name:'AL WASAT Organic', sub:'Organic Extra Virgin Olive Oil', price:'£28.99', unit:'/ 1 Litre', specs:[{l:'Origin',v:'Sfax Region, Tunisia'},{l:'Variety',v:'Chemlali & Chetoui'},{l:'Certification',v:'EU Organic Certified'},{l:'Acidity',v:'< 0.6%'},{l:'Extraction',v:'Cold-pressed, ≤ 27°C'},{l:'Format',v:'1 Litre glass bottle'}] }
  };
  const pdModal = document.getElementById('pdModal');
  if (pdModal) {
    const pdmClose = document.getElementById('pdmClose');
    function closePdm() { pdModal.classList.remove('open'); document.body.style.overflow = ''; }
    pdmClose.addEventListener('click', closePdm);
    pdModal.addEventListener('click', e => { if (e.target === pdModal) closePdm(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePdm(); });
    window['openDetails'] = function(e, btn) {
      e.preventDefault(); e.stopPropagation();
      const d = PRODUCT_DATA[btn.closest('.p-card').dataset.pid];
      if (!d) return;
      document.getElementById('pdmInner').innerHTML =
        `<div class="pdm-tag">${d.tag}</div>
         <div class="pdm-name">${d.name}</div>
         <div class="pdm-sub">${d.sub}</div>
         <div class="pdm-price">${d.price} <span class="pdm-price-lbl">${d.unit}</span></div>
         <div class="pdm-specs">${d.specs.map(s=>`<div class="pdm-spec"><div class="pdm-spec-label">${s.l}</div><div class="pdm-spec-val">${s.v}</div></div>`).join('')}</div>
         <a href="https://shop.al-wasat.co.uk" class="pdm-shop">Shop Now &nbsp;→</a>`;
      pdModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
  }

  /* === PRODUCT CARDS + FILTER (shop only) === */
  const cards = document.querySelectorAll('.p-card');
  if (cards.length > 0) {
    const cardObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const i = Array.from(cards).indexOf(e.target);
          setTimeout(() => e.target.classList.add('in'), i * 120);
          cardObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    cards.forEach(c => cardObs.observe(c));


    function updateLastRow() {
      const vis = [...cards].filter(c => c.style.display !== 'none');
      cards.forEach(c => c.classList.remove('last-row'));
      vis.slice(-2).forEach(c => c.classList.add('last-row'));
    }
    updateLastRow();

    window['filter'] = function(cat, btn) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      cards.forEach(c => {
        const match = cat === 'all' || c.dataset.cat.includes(cat);
        c.style.display = match ? '' : 'none';
        if (match) c.classList.add('in');
      });
      updateLastRow();
    };
  }

});
