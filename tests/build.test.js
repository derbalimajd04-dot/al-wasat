const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const origin = 'https://al-wasat.co.uk';

function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}

function outputTarget(reference, source) {
  const url = new URL(reference.replaceAll('&amp;', '&'), origin + source);
  if (url.origin !== origin || url.pathname.startsWith('/.netlify/functions/')) return null;
  const pathname = decodeURIComponent(url.pathname);
  let target = path.join(dist, pathname);
  if (pathname.endsWith('/')) target = path.join(target, 'index.html');
  else if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
  return target;
}

test('all page URLs and public file URLs survive the source reorganization', () => {
  const pages = path.join(root, 'src/pages');
  for (const source of files(pages)) {
    const relative = path.relative(pages, source);
    assert.ok(fs.existsSync(path.join(dist, relative)), `Missing page: /${relative}`);
    assert.deepEqual(fs.readFileSync(path.join(dist, relative)), fs.readFileSync(source));
  }

  const publicDir = path.join(root, 'public');
  for (const source of files(publicDir)) {
    const relative = path.relative(publicDir, source).replaceAll(path.sep, '/');
    const url = relative.replace(/^assets\/(?:images|videos)\//, 'assets/').replace(/^icons\//, '');
    assert.deepEqual(fs.readFileSync(path.join(dist, url)), fs.readFileSync(source), `Changed static file: /${url}`);
  }
});

test('published HTML, stylesheets, and sitemaps have valid local file targets', () => {
  const broken = [];
  function check(reference, source) {
    if (!reference || reference.startsWith('#')) return;
    const target = outputTarget(reference, source);
    if (target && !fs.existsSync(target)) broken.push(`${source} → ${reference}`);
  }

  for (const file of files(dist)) {
    const source = '/' + path.relative(dist, file).replaceAll(path.sep, '/');
    if (file.endsWith('.html')) {
      const html = fs.readFileSync(file, 'utf8');
      for (const match of html.matchAll(/\b(?:href|src|poster|data-src)\s*=\s*["']([^"']+)["']/gi)) check(match[1], source);
      for (const match of html.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi)) {
        for (const candidate of match[1].split(',')) check(candidate.trim().split(/\s+/)[0], source);
      }
    } else if (file.endsWith('.css')) {
      const css = fs.readFileSync(file, 'utf8');
      esbuild.transformSync(css, { loader: 'css' });
      for (const match of css.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)) check(match[2], source);
    }
  }

  const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)];
  assert.ok(locations.length > 0, 'Sitemap must contain page URLs');
  for (const [, location] of locations) check(location, '/sitemap.xml');
  const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'site.webmanifest'), 'utf8'));
  for (const icon of manifest.icons || []) check(icon.src, '/site.webmanifest');
  assert.deepEqual(broken, [], 'Broken local references');
});

test('deployment output contains only public website files', () => {
  const disallowed = /(?:^|\/)(?:src|scripts|tests|netlify|node_modules|\.git|\.claude|\.codex|\.agents|\.aws)(?:\/|$)|(?:^|\/)\.env(?:\.|$)|(?:^|\/)(?:package(?:-lock)?\.json|AGENTS\.md|CLAUDE\.md)$/;
  for (const file of files(dist)) {
    const relative = path.relative(dist, file).replaceAll(path.sep, '/');
    assert.equal(disallowed.test(relative), false, `Private/source file published: ${relative}`);
  }
  for (const required of ['index.html', '404.html', 'script.js', 'styles.css', 'assets/translations.js', 'assets/editorial.css', 'assets/editorial-home.css']) {
    assert.ok(fs.existsSync(path.join(dist, required)), `Missing public entry: ${required}`);
  }
});

test('content photos retain valid optimized WebP variants', async () => {
  const images = path.join(root, 'public/assets/images');
  const photos = files(images).filter(file => /\.jpe?g$/i.test(file) && path.basename(file) !== 'logo.jpg');
  assert.ok(photos.length > 0, 'Expected product and editorial source photos');
  for (const photo of photos) {
    const base = path.basename(photo).replace(/\.jpe?g$/i, '');
    for (const width of [640, 1280]) {
      const target = path.join(dist, 'assets', `${base}-${width}.webp`);
      const metadata = await sharp(target).metadata();
      assert.equal(metadata.format, 'webp', target);
      assert.ok(metadata.width > 0 && metadata.width <= width && metadata.height > 0, `Invalid dimensions: ${target}`);
    }
  }
});
