import { awT } from './copy.js';

export function initProductGallery() {
  const media = document.querySelector('.pdp-media');
  if (!media) return;
  const images = [...media.querySelectorAll('img')];
  if (images.length < 2) return;

  /* One full-frame photo at a time, using native scrolling on every screen.
     The controls live with the media so the purchase column stays alongside. */
  const gallery = document.createElement('div');
  gallery.className = 'pdp-gallery';
  media.parentNode.insertBefore(gallery, media);
  gallery.appendChild(media);
  media.id = media.id || 'pdpGallery';
  media.setAttribute('role', 'region');
  media.setAttribute('tabindex', '0');

  const controls = document.createElement('div');
  controls.className = 'pdp-gallery-controls';
  controls.setAttribute('role', 'group');
  const buttons = images.map((image, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pdp-gallery-choice';
    button.setAttribute('aria-controls', media.id);
    button.setAttribute('aria-current', String(index === 0));
    const thumbnail = document.createElement('img');
    thumbnail.src = image.getAttribute('srcset')?.split(',')[0].trim().split(/\s+/)[0] || image.src;
    thumbnail.alt = '';
    thumbnail.loading = 'lazy';
    thumbnail.decoding = 'async';
    button.appendChild(thumbnail);
    button.addEventListener('click', () => selectImage(index));
    controls.appendChild(button);
    return button;
  });
  gallery.appendChild(controls);

  let activeIndex = 0;
  function updateLabels() {
    const label = awT('pdp-gallery-label', 'Product images');
    media.setAttribute('aria-label', label);
    controls.setAttribute('aria-label', label);
    buttons.forEach((button, index) => {
      button.setAttribute('aria-label', awT('pdp-gallery-image', 'Image {current} of {total}')
        .replace('{current}', index + 1).replace('{total}', images.length));
    });
  }
  function setActive(index) {
    activeIndex = index;
    buttons.forEach((button, number) => button.setAttribute('aria-current', String(number === index)));
  }
  function selectImage(index) {
    const target = images[index].getBoundingClientRect();
    const frame = media.getBoundingClientRect();
    const rtl = document.documentElement.dir === 'rtl';
    const distance = rtl ? target.right - frame.right : target.left - frame.left;
    setActive(index);
    media.scrollTo({
      left: media.scrollLeft + distance,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }
  function handleKeys(event) {
    const rtl = document.documentElement.dir === 'rtl';
    let index = activeIndex;
    if (event.key === 'ArrowRight') index += rtl ? -1 : 1;
    else if (event.key === 'ArrowLeft') index += rtl ? 1 : -1;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = images.length - 1;
    else return;
    event.preventDefault();
    index = Math.max(0, Math.min(images.length - 1, index));
    selectImage(index);
    if (event.currentTarget === controls) buttons[index].focus();
  }
  media.addEventListener('keydown', handleKeys);
  controls.addEventListener('keydown', handleKeys);

  /* Compare centres instead of scrollLeft/width: this also works in RTL. */
  let scrollTimer;
  media.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const frame = media.getBoundingClientRect();
      const centre = (frame.left + frame.right) / 2;
      let nearest = 0;
      let distance = Infinity;
      images.forEach((image, index) => {
        const bounds = image.getBoundingClientRect();
        const delta = Math.abs((bounds.left + bounds.right) / 2 - centre);
        if (delta < distance) { nearest = index; distance = delta; }
      });
      setActive(nearest);
    }, 80);
  }, { passive: true });
  document.addEventListener('aw:languagechange', () => {
    updateLabels();
    /* Direction changes reposition native scroll origins; start at photo one. */
    setActive(0);
    media.scrollTo({ left: 0, behavior: 'instant' });
  });
  updateLabels();
}
