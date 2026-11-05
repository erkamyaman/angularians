/// <reference types="vitest" />

import { defineConfig, type Plugin } from 'vite';
import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';

const DEV_IMAGES = '/api/__dev-images';

function forwardImagesInDev(): Plugin {
  return {
    name: 'forward-images-in-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && /^\/(?:[^/?]+\/card|og)\.png(?:\?|$)/.test(req.url)) req.url = DEV_IMAGES + req.url;
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    port: 4202,
  },
  build: {
    target: ['es2020'],
  },
  resolve: {
    mainFields: ['module'],
  },
  plugins: [
    forwardImagesInDev(),
    analog({
      // No static pages: `/` reads `?period=` and `?country=`, so a build-time `index.html` would show the
      // default board for every shared link until the browser corrected it. Every page is server-rendered.
      prerender: { routes: [] },
      nitro: {
        handlers: [
          { route: `${DEV_IMAGES}/:username/card.png`, env: 'dev', handler: fileURLToPath(new URL('./src/server/routes/[username]/card.png.get.ts', import.meta.url)) },
          { route: `${DEV_IMAGES}/og.png`, env: 'dev', handler: fileURLToPath(new URL('./src/server/routes/og.png.get.ts', import.meta.url)) },
        ],
        // The two fonts of the Angularian card (src/server/card), inlined in the server: about 60 KB.
        // And the brand font, Norse Bold, for the word "Angularian" (public/fonts), about 30 KB.
        serverAssets: [
          { baseName: 'card-fonts', dir: fileURLToPath(new URL('./src/server/card/fonts', import.meta.url)) },
          { baseName: 'brand-font', dir: fileURLToPath(new URL('./public/fonts', import.meta.url)) },
        ],
        routeRules: {
          // Pages change with the data, once a night with a new deploy (which clears the CDN): browsers revalidate,
          // the CDN keeps a page an hour and may serve a stale one for a day while it refreshes it.
          // 400s and 404s too: they only change with the data. The API routes set their own, longer browser cache.
          // Netlify-Vary: a copy per parameter the routes read, or the CDN can answer with another URL's response (the wrong
          // country). Any other one (`?utm_source=`) shares the page's copy. A route reading a new parameter must add it here.
          // and per value of the signed-in hint cookie (app/src/app/auth/hint.ts), whose pages start with the signed-in
          // card's skeleton. Every other cookie is ignored by the cache.
          '/**': { headers: { 'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400', 'netlify-cdn-cache-control': 'public, durable, s-maxage=3600, stale-while-revalidate=86400', 'netlify-vary': 'query=period|country|page|q|flag|v,cookie=angularians-signed-in' } },
          // Sign-in: per person, with cookies. Never in a shared cache.
          '/api/auth/**': { headers: { 'cache-control': 'private, no-store', 'netlify-cdn-cache-control': 'no-store' } },
          // Hashed file names: never change.
          '/assets/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
        },
      },
    }),
    tailwindcss(),
    // The Spartan helm components are `@spartan-ng/helm/*` paths in tsconfig.json (src/ui).
    tsconfigPaths(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
  },
}));
