import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from 'vite-plugin-eslint';

// Hosts the app talks to in EVERY environment: the API plus geocoding and IP
// country lookup. Keep this in sync with the connect-src list in index.html —
// anything here that the production policy omits will be blocked once deployed.
const SHARED_CONNECT = [
  'https://api.thehorizonproperties.com',
  'https://api.saasflow.us',
  'https://nominatim.openstreetmap.org',
  'https://api.bigdatacloud.net',
  'https://photon.komoot.io',
  'https://ipapi.co',
].join(' ');

// Loopback variants for dev. CSP matches hosts literally, so `localhost` does
// NOT cover `127.0.0.1` or `[::1]` — the Vite dev server binds to [::1], and a
// blocked HMR websocket retries in a loop, which is what a burst of repeated
// connect-src violations looks like.
const DEV_CONNECT = [
  'ws://localhost:*',
  'wss://localhost:*',
  'ws://127.0.0.1:*',
  'ws://[::1]:*',
  'http://localhost:*',
  'http://127.0.0.1:*',
  'http://[::1]:*',
].join(' ');

const DEV_CSP =
  [
    "default-src 'self'",
    // 'unsafe-eval' is needed by the dev-only tooling; the production policy in
    // index.html deliberately omits it.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' ${DEV_CONNECT} ${SHARED_CONNECT}`,
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ') + ';';

/**
 * Browsers enforce EVERY Content-Security-Policy they receive and a resource
 * must satisfy all of them, so the effective policy is the intersection and the
 * strictest value always wins. That makes shipping both a <meta> CSP and a
 * header CSP a standing trap: the production meta tag (no localhost, no
 * 'unsafe-eval') silently overrode the permissive dev header and blocked every
 * localhost API call and the HMR socket.
 *
 * So: index.html carries the PRODUCTION policy, and we strip it during `serve`
 * so dev is governed solely by the header above. One list per environment.
 */
const stripCspMetaInDev = () => ({
  name: 'strip-csp-meta-in-dev',
  apply: 'serve',
  transformIndexHtml: (html) =>
    html.replace(
      /[ \t]*<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>\s*\n?/i,
      '',
    ),
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    eslint({
      failOnError: false,
    }),
    stripCspMetaInDev(),
  ],
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': DEV_CSP,
    },
  },
});
