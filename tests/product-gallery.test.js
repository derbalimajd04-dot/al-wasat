const test = require('node:test');
const assert = require('node:assert/strict');
const { browser } = require('./browser-harness');

function gallery(reducedMotion = false) {
  let media;
  const scrolls = [];
  const app = browser(undefined, {
    reducedMotion,
    setup({ document, element }) {
      media = element();
      media.scrollLeft = 0;
      media.getBoundingClientRect = () => ({ left: 0, right: 400 });
      media.scrollTo = value => { scrolls.push(value); media.scrollLeft = value.left; };
      const images = Array.from({ length: 3 }, (_, index) => {
        const image = element();
        image.src = `/assets/product-${index}-1280.webp`;
        image.setAttribute('srcset', `/assets/product-${index}-640.webp 640w, ${image.src} 1280w`);
        image.getBoundingClientRect = () => {
          const offset = (document.documentElement.dir === 'rtl' ? -1 : 1) * index * 400;
          return { left: offset - media.scrollLeft, right: offset - media.scrollLeft + 400 };
        };
        return image;
      });
      media.querySelectorAll = selector => selector === 'img' ? images : [];
      const parent = element();
      parent.appendChild(media);
      const original = document.querySelector;
      document.querySelector = selector => selector === '.pdp-media' ? media : original(selector);
    },
  });
  app.ready();
  const controls = media.parentNode.children.find(child => child.className === 'pdp-gallery-controls');
  assert.ok(controls, 'Gallery should expose thumbnail controls');
  const buttons = controls.children;
  const selected = () => buttons.map(button => button.getAttribute('aria-current'));
  function key(target, value) {
    let prevented = false;
    target.dispatchEvent({ type: 'keydown', key: value, currentTarget: target, preventDefault() { prevented = true; } });
    assert.equal(prevented, true, `Gallery must handle ${value}`);
  }
  return { app, media, controls, buttons, scrolls, selected, key };
}

test('gallery thumbnails, keyboard boundaries, and native swipe keep the selected photo synchronized', () => {
  const { app, media, controls, buttons, scrolls, selected, key } = gallery();
  assert.equal(media.getAttribute('tabindex'), '0');
  assert.equal(media.getAttribute('role'), 'region');
  assert.ok(media.getAttribute('aria-label'));
  assert.equal(buttons.length, 3);
  assert.deepEqual(selected(), ['true', 'false', 'false']);
  for (const [index, button] of buttons.entries()) {
    assert.equal(button.type, 'button');
    assert.equal(button.getAttribute('aria-controls'), media.id);
    assert.ok(button.getAttribute('aria-label').includes(String(index + 1)));
    assert.equal(button.children[0].src, `/assets/product-${index}-640.webp`);
    assert.equal(button.children[0].alt, '');
  }
  buttons[1].dispatchEvent({ type: 'click' });
  assert.deepEqual(selected(), ['false', 'true', 'false']);
  assert.equal(scrolls.at(-1).left, 400);
  assert.equal(scrolls.at(-1).behavior, 'smooth');
  key(media, 'End');
  assert.deepEqual(selected(), ['false', 'false', 'true']);
  key(media, 'ArrowRight');
  assert.equal(scrolls.at(-1).left, 800, 'ArrowRight must stop at the last photo');
  key(media, 'Home');
  assert.deepEqual(selected(), ['true', 'false', 'false']);
  key(controls, 'ArrowRight');
  assert.equal(buttons[1].focused, true, 'Thumbnail keyboard navigation should move focus');
  media.scrollLeft = 800;
  media.dispatchEvent({ type: 'scroll' });
  app.flushTimers();
  assert.deepEqual(selected(), ['false', 'false', 'true'], 'Native swipe must update the current thumbnail');
});

test('gallery respects reduced motion and reverses arrow navigation for Arabic', () => {
  const { app, media, buttons, scrolls, selected, key } = gallery(true);
  buttons[2].dispatchEvent({ type: 'click' });
  assert.ok(['instant', 'auto'].includes(scrolls.at(-1).behavior), 'Reduced motion must avoid smooth scrolling');
  app.window.applyLanguage('ar');
  assert.equal(app.document.documentElement.dir, 'rtl');
  assert.deepEqual(selected(), ['true', 'false', 'false']);
  assert.equal(media.scrollLeft, 0);
  assert.equal(media.getAttribute('aria-label'), app.window.I18N.ar['pdp-gallery-label']);
  key(media, 'ArrowLeft');
  assert.deepEqual(selected(), ['false', 'true', 'false']);
  assert.equal(scrolls.at(-1).left, -400);
  key(media, 'ArrowRight');
  assert.deepEqual(selected(), ['true', 'false', 'false']);
});
