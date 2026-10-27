#!/usr/bin/env node
const { execFileSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

/* Images are optimised at source by scripts/optimize-images.js, so the build
   only copies them. Fail loudly if a JPG was added without its WebP sizes —
   pages reference the WebPs directly and would show a broken image. */
function checkImages() {
  const assets = path.join(ROOT, 'public/assets/images');
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

/* Source organization does not change public URLs: icons still live at /
   and grouped media still lives at /assets/ in the deployed website. */
function publicPath(relative) {
  return relative
    .replace(/^assets\/(?:images|videos)\//, 'assets/')
    .replace(/^icons\//, '');
}

const outputs = new Set();
function copyFile(source, relative) {
  if (outputs.has(relative)) throw new Error(`Duplicate public URL: /${relative}`);
  outputs.add(relative);
  const destination = path.join(DIST, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function copyTree(directory, mapPath = relative => relative, prefix = '') {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    if (entry.name.startsWith('.') || entry.isSymbolicLink()) {
      throw new Error(`Unexpected private file or symlink in website source: ${entry.name}`);
    }
    const source = path.join(directory, entry.name);
    const relative = prefix + entry.name;
    if (entry.isDirectory()) copyTree(source, mapPath, relative + '/');
    else copyFile(source, mapPath(relative));
  }
}

async function main() {
  checkImages();
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST);
  copyTree(path.join(ROOT, 'src/pages'));
  copyTree(path.join(ROOT, 'public'), publicPath);

  for (const [entry, output] of [
    ['src/js/main.js', 'script.js'],
    ['src/js/translations.js', 'assets/translations.js'],
  ]) {
    if (outputs.has(output)) throw new Error(`Static file conflicts with bundle: /${output}`);
    await esbuild.build({
      absWorkingDir: ROOT,
      entryPoints: [entry],
      bundle: true,
      format: 'iife',
      minify: true,
      outfile: path.join(DIST, output),
    });
  }

  if (outputs.has('styles.css')) throw new Error('Static file conflicts with bundle: /styles.css');
  execFileSync(path.join(ROOT, 'node_modules/.bin/lightningcss'), [
    '--bundle', '--minify', 'src/styles/main.css', '-o', 'dist/styles.css',
  ], { stdio: 'inherit', cwd: ROOT });
  for (const file of ['editorial.css', 'editorial-home.css']) {
    copyFile(path.join(ROOT, 'src/styles', file), `assets/${file}`);
  }

  console.log('\n✓ Build complete → dist/');
}

main().catch(err => { console.error(err.message); process.exit(1); });
