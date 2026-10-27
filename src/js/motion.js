import { chromePerformance } from './browser.js';

export function initScrollReveal() {
  /* === SCROLL REVEAL === */
  /* Reveal targets sit at opacity:0 (under html.js). If IntersectionObserver
     is unavailable, or the user prefers reduced motion, show everything at
     once rather than leaving the page blank. */
  const prefersReduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealAll = () =>
    document.querySelectorAll('.reveal,.p-card,.j-card').forEach(el => el.classList.add('in'));

  if (prefersReduce || typeof IntersectionObserver === 'undefined') {
    revealAll();
  } else {
    const revealObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
    /* Safety net: anything still hidden after 4s is shown regardless. */
    setTimeout(revealAll, 4000);
  }


  return prefersReduce;
}

export function initSmoothScroll() {
/* === LENIS SMOOTH SCROLL === */
(function() {
  /* Native Chrome scrolling avoids a permanent RAF loop and lets compositor
     scrolling continue without waiting for the page's JavaScript thread. */
  if (chromePerformance) return;
  if (typeof Lenis === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(max-width: 767px)').matches) return;
  /* Smooth-scroll hijacking is a vestibular trigger — leave native scrolling
     in place when the user has asked for reduced motion. */
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var lenis = new Lenis({
    duration: 1.2,
    easing: function(t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    smooth: true,
  });
  /* Pause when body overflow is locked (cart drawer / mobile nav open) */
  new MutationObserver(function(muts) {
    muts.forEach(function(m) {
      if (m.attributeName !== 'style') return;
      if (document.body.style.overflow === 'hidden') lenis.stop();
      else lenis.start();
    });
  }).observe(document.body, { attributes: true, attributeFilter: ['style'] });
  /* Run Lenis on every animation frame */
  (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
  window._lenis = lenis;

  /* Drive scroll-position effects through Lenis so they stay in sync with the RAF loop */
  lenis.on('scroll', function(e) {
    var scroll = e.scroll;
    var navEl = document.querySelector('nav');
    if (navEl) navEl.classList.toggle('scrolled', scroll > 60);
  });

  /* Anchor-link scrolling handled by Lenis (html scroll-behavior:auto set in CSS) */
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var hash = link.getAttribute('href');
    var target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -80, duration: 1.2 });
  });
})();
}

export function initStatCounters() {
/* === 5. STAT NUMBER COUNTER === */
(function(){
  const els = document.querySelectorAll('.stat-n');
  if (!els.length) return;
  const obs = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (!entry.isIntersecting) return;
      obs.unobserve(entry.target);
      const el = entry.target;
      const raw = el.textContent.trim();
      if (raw === '∞' || raw === '0') return;
      const suffix = raw.replace(/[0-9.]/g, '');
      const end = parseFloat(raw);
      if (isNaN(end)) return;
      const dur = 1800;
      const t0 = performance.now();
      (function tick(now){
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * end) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = raw;
      })(t0);
    });
  }, {threshold:0.6});
  els.forEach(function(el){ obs.observe(el); });
})();
}

export function initBackgroundVideos() {
/* === LAZY BACKGROUND VIDEO ===
   Videos ship with preload="none" and only a poster frame. The file is
   fetched once the video is near the viewport — never on data-saver
   connections, under reduced motion, or when CSS hides the video (the shop
   video is display:none on phones). The poster stays as the still image. */
(function () {
  var vids = document.querySelectorAll('video[data-src]');
  if (!vids.length) return;
  var conn = navigator.connection || {};
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '') || reduce) return;

  function load(v) {
    if (getComputedStyle(v).display === 'none') return;
    if (v.hasAttribute('data-src')) {
      v.src = v.dataset.src;
      v.removeAttribute('data-src');
    }
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }
  if (typeof IntersectionObserver === 'undefined') { vids.forEach(load); return; }
  /* Chrome should decode the decorative video only while it can be seen.
     Keep observing after loading so leaving the section releases that work. */
  if (chromePerformance) {
    var visible = new Set();
    function syncPlayback(v) {
      if (!document.hidden && visible.has(v)) load(v);
      else v.pause();
    }
    var playbackObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
        syncPlayback(e.target);
      });
    });
    vids.forEach(function (v) { playbackObs.observe(v); });
    document.addEventListener('visibilitychange', function () {
      vids.forEach(syncPlayback);
    });
    return;
  }
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { obs.unobserve(e.target); load(e.target); }
    });
  }, { rootMargin: '200px' });
  vids.forEach(function (v) { obs.observe(v); });
})();
}
