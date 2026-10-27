const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { browser } = require('./browser-harness');

test('the bundled script keeps HTML and checkout integration functions public', () => {
  const { window, ready } = browser(undefined, { shop: true });
  ready();
  const expected = ['openCart', 'closeCart', 'acceptCookie', 'declineCookie', 'getCart', 'saveCart', 'addToCartById', 'cartQty', 'cartRemove', 'applyLanguage', 'awT', '_unitLabel'];
  for (const name of expected) assert.equal(typeof window[name], 'function', `Missing window.${name}`);

  function scan(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) scan(file);
      else if (entry.name.endsWith('.html')) {
        const html = fs.readFileSync(file, 'utf8');
        for (const [, handler] of html.matchAll(/\bonclick="([a-zA-Z_$][\w$]*)\(/g)) {
          assert.equal(typeof window[handler], 'function', `Missing inline handler ${handler} in ${file}`);
        }
      }
    }
  }
  scan(path.join(__dirname, '..', 'dist'));
});

test('Chrome performance scoping excludes Safari and other Chromium browsers', () => {
  const cases = [
    [{ userAgent: 'Mozilla/5.0 Chrome/141.0.0.0 Safari/537.36' }, true],
    [{ userAgent: 'Mozilla/5.0 Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0' }, false],
    [{ userAgent: 'Mozilla/5.0 Version/18.0 Safari/605.1.15' }, false],
    [{ userAgent: 'Mozilla/5.0 CriOS/141.0.0.0 Mobile Safari/604.1' }, false],
    [{ userAgentData: { brands: [{ brand: 'Google Chrome', version: '141' }] } }, true],
    [{ userAgentData: { brands: [{ brand: 'Microsoft Edge', version: '141' }, { brand: 'Chromium', version: '141' }] } }, false],
  ];
  for (const [navigator, enabled] of cases) {
    const { document } = browser(navigator);
    assert.equal(document.documentElement.classList.contains('chrome-performance'), enabled, JSON.stringify(navigator));
  }
});

test('cart survives bundling with current prices, validated storage, and working quantities', () => {
  const { window, storage } = browser();
  storage.set('alwasat_cart', '{broken json');
  assert.equal(window.getCart().length, 0);
  storage.set('alwasat_cart', JSON.stringify([
    { pid: 'classic-500', qty: 2, priceNum: 0.01, name: 'Stale name' },
    { pid: 'not-a-product', qty: 1 },
    { pid: 'organic-500', qty: -1 },
    { pid: 'organic-500', qty: '2' },
    null,
  ]));
  let cart = window.getCart();
  assert.equal(cart.length, 1);
  assert.equal(cart[0].priceNum, 13.99);
  assert.notEqual(cart[0].name, 'Stale name');
  window.addToCartById('classic-500', 3);
  assert.equal(window.getCart()[0].qty, 5);
  window.cartQty('classic-500', -100);
  assert.equal(window.getCart()[0].qty, 1);
  window.addToCartById('gift-card', 999);
  assert.equal(window.getCart().find(item => item.pid === 'gift-card').qty, 24);
  window.addToCartById('not-a-product', 1);
  assert.equal(window.getCart().length, 2);
  assert.deepEqual(Object.keys(JSON.parse(storage.get('alwasat_cart'))[0]).sort(), ['pid', 'qty']);
  window.cartRemove('classic-500');
  assert.equal(window.getCart().length, 1);
  assert.equal(window.getCart()[0].pid, 'gift-card');
});

test('language changes preserve translated copy, persisted language, and Arabic direction', () => {
  const { window, storage, document, text, dispatched } = browser();
  for (const language of ['fr', 'ar', 'en']) {
    window.applyLanguage(language);
    assert.equal(document.documentElement.getAttribute('lang'), language);
    assert.equal(document.documentElement.getAttribute('dir'), language === 'ar' ? 'rtl' : 'ltr');
    assert.equal(text.textContent, window.I18N[language]['nav-home']);
    assert.equal(storage.get('alwasat_lang'), language);
    assert.equal(window.awT('editorial-title-1', 'Fallback'), window.I18N[language]['editorial-title-1']);
    assert.equal(dispatched.at(-1).detail.lang, language);
  }
  window.applyLanguage('unsupported');
  assert.equal(document.documentElement.getAttribute('lang'), 'en');
  assert.equal(window.awT('nonexistent-test-key', 'Fallback'), 'Fallback');
});

test('the actual checkout page renders cart names, translated units, quantities, and totals', () => {
  const { window, document, runScript, ready } = browser(undefined, { checkout: true });
  const html = fs.readFileSync(path.join(__dirname, '..', 'dist/checkout/index.html'), 'utf8');
  const inline = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .find(([, script]) => script.includes('function renderSummary()'));
  assert.ok(inline, 'Checkout summary script must be present');
  window.saveCart([{ pid: 'classic-1l', qty: 2 }, { pid: 'gift-card', qty: 3 }]);
  runScript(inline[1], 'checkout/index.html inline');
  ready();

  function verifySummary(language) {
    const summary = document.getElementById('coItems').innerHTML;
    assert.ok(summary.includes(window.I18N[language]['home-p1-name']), 'Translated product name missing');
    assert.ok(summary.includes(window.I18N[language]['pname-giftcard']), 'Translated gift card name missing');
    for (const key of ['unit-litre', 'unit-card']) {
      assert.ok(summary.includes(window.I18N[language][key].replace('/ ', '')), `Missing ${language} ${key}`);
    }
    for (const value of ['&times; 2', '&times; 3', '£45.98', '£45.00']) assert.ok(summary.includes(value), value);
    assert.equal(document.getElementById('coTotal').textContent, '£90.98');
  }
  verifySummary('en');
  for (const language of ['fr', 'ar']) {
    window.applyLanguage(language);
    verifySummary(language);
  }
});
