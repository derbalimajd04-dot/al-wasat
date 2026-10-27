# Al Wasat

Static storefront for Al Wasat, deployed to Netlify.

## Project structure

```text
src/
  pages/             HTML pages, organized by their public routes
  js/                Feature modules; main.js is the application entry
    locales/         English, French and Arabic translation dictionaries
  styles/            Shared CSS modules and the editorial theme
public/
  assets/images/     Product photos, editorial images and WebP variants
  assets/videos/     Background videos
  icons/             Favicons and app icons
  robots.txt         Other public site metadata also lives here
netlify/functions/   Checkout, contact, newsletter and order email handlers
scripts/             Build and image optimization tools
tests/               Build, links, cart, language and browser scoping checks
dist/                Generated deployment output; ignored by Git
```

## Development

```sh
npm ci
npm run build
npm test
npm run dev
```

`npm run dev` builds the site, then starts Netlify Dev (requires the Netlify
CLI). Rebuild after changing source files. For a static preview without
server functions, serve `dist/` with a local HTTP server after building.

Add or replace source photos in `public/assets/images/`, then run
`npm run optimize:images` to generate their 640px and 1280px WebP variants.

## Source files and published URLs

The build preserves the existing website addresses:

| Edit | Published at |
| --- | --- |
| `src/pages/index.html` | `/` |
| `src/pages/shop/index.html` | `/shop/` |
| `src/js/main.js` and its imports | `/script.js` |
| `src/js/locales/*.js` | `/assets/translations.js` |
| `src/styles/main.css` and its imports | `/styles.css` |
| `src/styles/editorial*.css` | `/assets/editorial*.css` |
| `public/assets/images/*` and `public/assets/videos/*` | `/assets/*` |
| `public/icons/*` | `/*` |

Do not edit `dist/`: rebuilding replaces it. The CSS import order in
`src/styles/main.css` preserves the established cascade; visual changes
belong in the editorial files. See `design-system/al-wasat/MASTER.md`.

## Working with Codex and Claude

Use a separate branch and Git worktree for each agent. Assign different
features or files, run the build and tests on each branch, then review and
merge the changes. Tool configuration stays in the existing hidden folders.
Local environment files stay outside `src/` and `public/` and are ignored by Git.
