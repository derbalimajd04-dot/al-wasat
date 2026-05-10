#!/usr/bin/env node
const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

function walkHtml(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkHtml(full));
    else if (entry.name.endsWith('.html')) results.push(full);
  }
  return results;
}

function addWebpSources(html) {
  return html.replace(/<img\b([^>]*)>/g, (match, attrs) => {
    const srcMatch = attrs.match(/src="(\/assets\/[^"]+\.png)"/);
    if (!srcMatch) return match;
    const webpSrc = srcMatch[1].replace(/\.png$/, '.webp');
    return `<picture><source srcset="${webpSrc}" type="image/webp"><img${attrs}></picture>`;
  });
}

async function processImages() {
  const assetsDir = path.join(DIST, 'assets');
  const files = fs.readdirSync(assetsDir).filter(f => /\.(png|jpg|jpeg)$/i.test(f));
  let totalSaved = 0;

  await Promise.all(files.map(async (file) => {
    const src  = path.join(assetsDir, file);
    const base = path.basename(file, path.extname(file));
    const maxWidth = file.startsWith('product-') ? 1000 : 1920;
    const origSize = fs.statSync(src).size;

    await sharp(src)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(assetsDir, `${base}.webp`));

    const compressed = await sharp(src)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(src, compressed);

    const saved = origSize - compressed.length;
    totalSaved += saved;
    const pct = Math.round((saved / origSize) * 100);
    console.log(`  ${file}: ${(origSize / 1e6).toFixed(1)}MB → ${(compressed.length / 1e3).toFixed(0)}KB (−${pct}%)`);
  }));

  return totalSaved;
}

async function main() {
  if (fs.existsSync(DIST)) run('rm -rf dist');
  fs.mkdirSync(DIST);

  const staticItems = [
    'index.html', '404.html', 'sitemap.xml', 'robots.txt',
    'favicon.svg', 'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png',
    'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png',
    'manifest.json', 'site.webmanifest', 'CNAME',
    'assets', 'checkout', 'journal', 'legal', 'shop', 'trade',
  ];
  for (const item of staticItems) {
    const src = path.join(ROOT, item);
    if (fs.existsSync(src)) run(`cp -r "${src}" dist/`);
  }

  run('npx esbuild script.js --bundle=false --minify --outfile=dist/script.js');
  run('npx lightningcss --minify styles.css -o dist/styles.css');

  console.log('\nOptimising images…');
  const saved = await processImages();
  console.log(`  Total saved: ${(saved / 1e6).toFixed(1)}MB`);

  console.log('\nPatching HTML for WebP…');
  for (const f of walkHtml(DIST)) {
    const content = fs.readFileSync(f, 'utf8');
    const patched = addWebpSources(content);
    if (patched !== content) {
      fs.writeFileSync(f, patched);
      console.log(' ', path.relative(DIST, f));
    }
  }

  console.log('\n✓ Build complete → dist/');
}

main().catch(err => { console.error(err); process.exit(1); });
