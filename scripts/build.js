#!/usr/bin/env node
const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

/* Images are optimised at source by scripts/optimize-images.js, so the build
   only copies them. Fail loudly if a JPG was added without its WebP sizes —
   pages reference the WebPs directly and would show a broken image. */
function checkImages() {
  const assets = path.join(ROOT, 'assets');
  const missing = fs.readdirSync(assets)
    .filter(f => /\.jpe?g$/i.test(f) && f !== 'logo.jpg')
    .filter(f => {
      const base = f.replace(/\.jpe?g$/i, '');
      return ![640, 1280].every(w => fs.existsSync(path.join(assets, `${base}-${w}.webp`)));
    });
  if (missing.length) {
    throw new Error(`Missing WebP sizes for: ${missing.join(', ')}\nRun: npm run optimize:images`);
  }
}

async function main() {
  checkImages();
  if (fs.existsSync(DIST)) run('rm -rf dist');
  fs.mkdirSync(DIST);

  const staticItems = [
    'index.html', '404.html', 'sitemap.xml', 'robots.txt',
    'favicon.svg', 'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png',
    'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png',
    'manifest.json', 'site.webmanifest', 'CNAME',
    'about', 'assets', 'checkout', 'journal', 'legal', 'shop', 'trade',
  ];
  for (const item of staticItems) {
    const src = path.join(ROOT, item);
    if (fs.existsSync(src)) run(`cp -r "${src}" dist/`);
  }

  run('npx esbuild script.js --bundle=false --minify --outfile=dist/script.js');
  run('npx lightningcss --minify styles.css -o dist/styles.css');

  console.log('\n✓ Build complete → dist/');
}

main().catch(err => { console.error(err); process.exit(1); });
