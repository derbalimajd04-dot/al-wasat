const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const { browser } = require('./browser-harness');

const dist = path.join(__dirname, '..', 'dist');
const origin = 'https://al-wasat.co.uk';
const productIds = ['classic-500', 'classic-1l', 'organic-500', 'organic-1l', 'tasting-250ml', 'bulk-3l', 'gift-box', 'subscription-box', 'gift-card'];
const read = url => fs.readFileSync(path.join(dist, url, url.endsWith('/') ? 'index.html' : ''), 'utf8');
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`))?.[1];

function shopCards() {
  const html = read('/shop/');
  const starts = [...html.matchAll(/<(?:div|article)\b[^>]*class="[^"]*\bp-card\b[^"]*"[^>]*>/g)];
  return starts.map((match, index) => ({
    pid: attribute(match[0], 'data-pid'),
    url: attribute(match[0], 'data-url'),
    html: html.slice(match.index, starts[index + 1]?.index || html.length),
  }));
}

function productSchema(html) {
  const blocks = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  for (const [, source] of blocks) {
    const data = JSON.parse(source);
    const candidates = Array.isArray(data) ? data : data['@graph'] || [data];
    const product = candidates.find(item => item['@type'] === 'Product');
    if (product) return product;
  }
  assert.fail('Product structured data missing');
}

test('all nine products have a dedicated page and keep a separate Details quick view', () => {
  const cards = shopCards();
  assert.deepEqual(cards.map(card => card.pid).sort(), [...productIds].sort());
  const { window } = browser();
  const sitemap = read('/sitemap.xml');
  const urls = new Set();
  for (const card of cards) {
    const data = window.PRODUCT_DATA[card.pid];
    assert.ok(data, `Missing catalog product ${card.pid}`);
    assert.match(card.url || '', /^\/shop\/[^/?#]+\/$/, `Missing dedicated URL: ${card.pid}`);
    assert.equal(urls.has(card.url), false, `Duplicate product route ${card.url}`);
    urls.add(card.url);
    const links = [...card.html.matchAll(/<a\b[^>]*>/g)].map(match => match[0]);
    for (const name of ['p-name-link', 'p-img-link']) {
      const link = links.find(tag => (attribute(tag, 'class') || '').split(/\s+/).includes(name));
      assert.equal(attribute(link || '', 'href'), card.url, `${name} target missing: ${card.pid}`);
    }
    const details = [...card.html.matchAll(/<button\b[^>]*class="[^"]*\bp-details-btn\b[^"]*"[^>]*>/g)];
    assert.equal(details.length, 1, `One Details button required: ${card.pid}`);
    assert.equal(attribute(details[0][0], 'type'), 'button');
    assert.match(attribute(details[0][0], 'onclick') || '', /openDetails\(/);
    const html = read(card.url);
    assert.match(html, /<h1\b/, `Page heading missing: ${card.pid}`);
    assert.ok(html.includes(`data-pid="${card.pid}"`), `Wrong add-to-cart product: ${card.pid}`);
    const price = html.match(/class="pdp-price"[^>]*>([\s\S]*?)<\/div>/)?.[1];
    assert.ok(price?.includes(data.price), `Displayed price mismatch: ${card.pid}`);
    const canonical = [...html.matchAll(/<link\b[^>]*>/g)].map(match => match[0]).find(tag => attribute(tag, 'rel') === 'canonical');
    assert.equal(attribute(canonical || '', 'href'), origin + card.url);
    const schema = productSchema(html);
    assert.ok(schema.name && schema.description, `Incomplete structured data: ${card.pid}`);
    assert.equal(Number(schema.offers.price), Number(data.price.replace('£', '')));
    assert.equal(schema.offers.priceCurrency, 'GBP');
    assert.equal(schema.offers.url, origin + card.url);
    assert.ok(sitemap.includes(`<loc>${origin + card.url}</loc>`), `Page absent from sitemap: ${card.pid}`);
    for (const image of [].concat(schema.image || [])) {
      const url = new URL(typeof image === 'string' ? image : image.url);
      assert.equal(url.origin, origin);
      assert.ok(fs.existsSync(path.join(dist, url.pathname)), `Broken schema image: ${url.pathname}`);
    }
  }
});

test('every product gallery has three distinct responsive photos including the new lifestyle photo', async () => {
  for (const card of shopCards()) {
    const html = read(card.url);
    const media = html.match(/<div\b[^>]*class="[^"]*\bpdp-media\b[^"]*"[^>]*>([\s\S]*?)<\/div>/)?.[1];
    assert.ok(media, `Gallery missing: ${card.pid}`);
    const images = [...media.matchAll(/<img\b[^>]*>/g)].map(match => match[0]);
    assert.ok(images.length >= 3, `Three gallery images required: ${card.pid}`);
    const sources = images.map(tag => attribute(tag, 'src'));
    assert.equal(new Set(sources).size, images.length, `Duplicate gallery photo: ${card.pid}`);
    assert.ok(sources.some(src => src.includes('-lifestyle-')), `Lifestyle image missing: ${card.pid}`);
    for (const [index, tag] of images.entries()) {
      assert.ok(attribute(tag, 'alt')?.trim(), `Image description missing: ${card.pid}`);
      assert.ok(attribute(tag, 'sizes'), `Responsive sizes missing: ${card.pid}`);
      if (index === 0) assert.notEqual(attribute(tag, 'loading'), 'lazy', `Primary image must load promptly: ${card.pid}`);
      else assert.equal(attribute(tag, 'loading'), 'lazy', `Secondary image should be lazy: ${card.pid}`);
      const srcset = attribute(tag, 'srcset') || '';
      for (const width of [640, 1280]) {
        const source = srcset.split(',').map(value => value.trim().split(/\s+/)).find(([, descriptor]) => descriptor === `${width}w`)?.[0];
        assert.ok(source, `Missing ${width}px responsive source: ${card.pid}`);
        const metadata = await sharp(path.join(dist, source)).metadata();
        assert.equal(metadata.format, 'webp');
        assert.equal(metadata.width, width, `Wrong responsive width: ${source}`);
        assert.ok(metadata.height > 0);
      }
    }
  }
});

test('Details opens quick view for every product without leaving the collection; legacy deep links still work', () => {
  const app = browser(undefined, { shop: true });
  app.ready();
  const modal = app.nodes.get('pdModal');
  for (const card of shopCards()) {
    const node = app.cards[0];
    node.dataset = { pid: card.pid, url: card.url, cat: 'all' };
    const button = { focus() {}, classList: { contains: name => name === 'p-details-btn' }, closest: selector => selector === '.p-card' ? node : null };
    let prevented = false;
    let stopped = false;
    app.window.openDetails({ preventDefault() { prevented = true; }, stopPropagation() { stopped = true; } }, button);
    assert.equal(prevented, true);
    assert.equal(stopped, true);
    assert.equal(app.window.location.href, '/shop/', `Details navigated instead of opening quick view: ${card.pid}`);
    assert.equal(modal.classList.contains('open'), true, `Quick view did not open: ${card.pid}`);
    assert.equal(modal.inert, false);
    assert.ok(app.nodes.get('pdmInner').innerHTML.includes(app.window.PRODUCT_DATA[card.pid].price));
    app.nodes.get('pdmClose').dispatchEvent({ type: 'click' });
    assert.equal(modal.classList.contains('open'), false);
    assert.equal(modal.inert, true);

    const linked = browser(undefined, { shop: true, search: `?product=${card.pid}` });
    linked.ready();
    assert.equal(linked.window.location.href, card.url, `Old deep link stopped working: ${card.pid}`);
    node.closest = () => node;
    app.window.openDetails({ preventDefault() {}, stopPropagation() {} }, node);
    assert.equal(app.window.location.href, card.url, `Card no longer opens product page: ${card.pid}`);
    app.window.location.href = '/shop/';
    app.window.openDetails({ target: { closest: () => ({ href: card.url }) }, preventDefault() { assert.fail('Native product links must support new-tab gestures'); }, stopPropagation() {} }, node);
  }
});
