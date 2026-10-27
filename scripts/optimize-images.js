#!/usr/bin/env node
/* Image optimiser — run once whenever a photo in public/assets/images is added or replaced:
     npm run optimize:images

   For every content JPG in public/assets/images it writes two WebP sizes next to it:
     name-640.webp   phones and small cards
     name-1280.webp  desktop and high-density screens
   and re-encodes the JPG itself at a sane size. The JPG is only used by
   social previews (og:image) and structured data; pages load the WebPs
   through srcset, so the browser picks the smallest file that looks sharp.

   Safe to re-run: sources are never enlarged, and outputs are overwritten. */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS = path.resolve(__dirname, '..', 'public', 'assets', 'images');
const WIDTHS = [640, 1280];
const JPG_MAX = 1600;
const SKIP = new Set(['logo.jpg']);

async function optimise(file) {
  const src = path.join(ASSETS, file);
  const base = path.basename(file, path.extname(file));
  const input = fs.readFileSync(src);
  const before = input.length;
  let after = 0;

  for (const w of WIDTHS) {
    const out = path.join(ASSETS, `${base}-${w}.webp`);
    await sharp(input)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 72, effort: 6 })
      .toFile(out);
    after += fs.statSync(out).size;
  }

  const jpg = await sharp(input)
    .resize({ width: JPG_MAX, withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
  if (jpg.length < before) fs.writeFileSync(src, jpg);

  console.log(`  ${file}: ${(before / 1e3).toFixed(0)}KB → jpg ${(Math.min(jpg.length, before) / 1e3).toFixed(0)}KB, webp pair ${(after / 1e3).toFixed(0)}KB`);
}

async function main() {
  const files = fs.readdirSync(ASSETS).filter(f => /\.jpe?g$/i.test(f) && !SKIP.has(f));
  for (const f of files) await optimise(f);
  console.log(`\n✓ ${files.length} images optimised`);
}

main().catch(err => { console.error(err); process.exit(1); });
