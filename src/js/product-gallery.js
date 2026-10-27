export function initProductGallery() {
/* === PDP GALLERY DOTS ===
     The mobile product gallery is a scroll-snap row. Without a visible
     indicator it is undiscoverable, and there is no way to tell how many
     images exist. Dots are built from the actual images, so they stay
     correct if a product gains or loses a shot. */
  (function () {
    var media = document.querySelector('.pdp-media');
    if (!media) return;
    var imgs = media.querySelectorAll('img');
    if (imgs.length < 2) return;

    var dots = document.createElement('div');
    dots.className = 'pdp-dots';
    dots.setAttribute('role', 'tablist');
    dots.setAttribute('aria-label', 'Product images');
    imgs.forEach(function (img, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pdp-dot';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Image ' + (i + 1) + ' of ' + imgs.length);
      b.setAttribute('aria-current', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () {
        media.scrollTo({ left: img.offsetLeft - media.offsetLeft, behavior: 'smooth' });
      });
      dots.appendChild(b);
    });
    media.parentNode.insertBefore(dots, media.nextSibling);

    var all = dots.querySelectorAll('.pdp-dot');
    var tick;
    media.addEventListener('scroll', function () {
      clearTimeout(tick);
      tick = setTimeout(function () {
        var i = Math.round(media.scrollLeft / media.clientWidth);
        all.forEach(function (d, n) { d.setAttribute('aria-current', n === i ? 'true' : 'false'); });
      }, 60);
    }, { passive: true });
  })();
}
