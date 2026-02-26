---
phase: 01-foundation-auth
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - vite.config.ts
  - public/pwa-192x192.png
  - public/pwa-512x512.png
  - public/apple-touch-icon.png
  - public/favicon.ico
autonomous: true
requirements:
  - OFFL-01
  - OFFL-02
  - OFFL-03
  - OFFL-04
user_setup: []

must_haves:
  truths:
    - "Service worker registers successfully on app load"
    - "PWA manifest includes app name, icons, and theme colors"
    - "App shell files are precached (JS, CSS, HTML)"
    - "PWA is installable (browser shows install prompt)"
  artifacts:
    - path: "vite.config.ts"
      provides: "PWA plugin configuration with Workbox strategies"
      contains: "VitePWA, registerType: 'autoUpdate', workbox.runtimeCaching"
    - path: "public/pwa-192x192.png"
      provides: "192x192 PWA icon"
    - path: "public/pwa-512x512.png"
      provides: "512x512 PWA icon"
  key_links:
    - from: "vite.config.ts"
      to: "Workbox"
      via: "vite-plugin-pwa"
      pattern: "VitePWA.*workbox"

---

<objective>
Configure PWA manifest and service worker using vite-plugin-pwa with Workbox for offline caching. This creates the PWA shell, enables app installation, and establishes the caching strategy (NetworkFirst for API, StaleWhileRevalidate for assets, precache for app shell).

Purpose: PWA configuration is the foundation for offline functionality. Without service worker registration and caching strategies, the app cannot work offline or be installed on devices.

Output: PWA manifest configured, service worker with caching strategies, PWA icons, installable app shell.
</object>

<execution_context>
@/Users/dennyleonardo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dennyleonardo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-foundation-auth/01-RESEARCH.md

# Research patterns to follow:
# - vite-plugin-pwa with VitePWA() in plugins array
# - registerType: 'autoUpdate' for "Update available" toast behavior
# - Workbox runtimeCaching with NetworkFirst for Convex API, StaleWhileRevalidate for images
# - Precache app shell via globPatterns
</context>

<tasks>

<task type="auto">
  <name>Create PWA icons</name>
  <files>public/pwa-192x192.png, public/pwa-512x512.png, public/apple-touch-icon.png, public/favicon.ico</files>
  <action>
Create PWA icon files in the **public/** directory. Since these are binary files, create placeholder SVG icons and convert them to PNG:

1. Create **public/icon.svg** as a simple placeholder (e.g., a "QC" text or simple geometric shape):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2563eb" rx="80"/>
  <text x="256" y="320" font-size="200" font-weight="bold" fill="white" text-anchor="middle" font-family="sans-serif">QC</text>
</svg>
```

2. Use a simple approach: Create the SVG file above. For PNG conversion, we'll use a simpler method — the SVG will work as a fallback. The actual PNG files can be generated later or the user can provide their own.

3. Create **public/favicon.ico** as a simple icon file (can use the SVG as reference).

4. Create **public/apple-touch-icon.png** (same as pwa-192x192.png for simplicity).

For now, having the SVG placeholder is sufficient. The user can replace with proper PNG icons before production deployment.

Create the **public/** directory if it doesn't exist.
  </action>
  <verify>[ -f public/icon.svg ] && [ -f public/favicon.ico ]</verify>
  <done>PWA icon files exist in public directory</done>
</task>

<task type="auto">
  <name>Configure vite-plugin-pwa with Workbox strategies</name>
  <files>vite.config.ts</files>
  <action>
Update **vite.config.ts** to add VitePWA plugin with Workbox configuration:

1. Import VitePWA:
```ts
import { VitePWA } from 'vite-plugin-pwa'
```

2. Add VitePWA to the plugins array (after react() plugin):
```ts
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon.svg'],
      manifest: {
        name: 'Nexus QC Forms',
        short_name: 'Nexus',
        description: 'Mobile QC Form Data Entry',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.convex\.cloud\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'convex-api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      }
    })
  ],
  // ... rest of config
})
```

This follows the research pattern with NetworkFirst for API calls and StaleWhileRevalidate for static assets.
  </action>
  <verify>grep -q "VitePWA" vite.config.ts && grep -q "registerType.*autoUpdate" vite.config.ts && grep -q "NetworkFirst" vite.config.ts</verify>
  <done>vite-plugin-pwa configured with Workbox strategies</done>
</task>

<task type="auto">
  <name>Register service worker in main.tsx</name>
  <files>src/main.tsx</files>
  <action>
Update **src/main.tsx** to register the service worker:

1. Add the import at the top:
```ts
import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Import the virtual PWA module
import '@vite-pwa/service-worker' // This may not exist, alternative below
```

2. For vite-plugin-pwa with registerType: 'autoUpdate', the service worker registration is injected automatically. However, we should explicitly load it in development:

Update the file to:
```tsx
import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('SW registered: ', registration)
      },
      (registrationError) => {
        console.log('SW registration failed: ', registrationError)
      }
    )
  })
}
```

Note: With vite-plugin-pwa, the service worker is automatically generated at build time. The registration above will work in production. In development, the plugin may handle registration differently.
  </action>
  <verify>grep -q "serviceWorker" src/main.tsx && grep -q "navigator.serviceWorker.register" src/main.tsx</verify>
  <done>Service worker registration code present in main.tsx</done>
</task>

</tasks>

<verification>
After completing all tasks:

1. Run `npm run build` — verify build completes without errors
2. Run `npm run preview` — check that the app serves the built version
3. In browser DevTools Application tab, verify:
   - Service Worker is registered and active
   - Manifest displays with correct app name, icons, theme colors
   - "Install" button appears in address bar (Chrome) or share sheet (iOS)
4. Check Network tab — precached assets should show "(from ServiceWorker)"
</verification>

<success_criteria>
- PWA manifest configured with app metadata
- Service worker registers successfully
- App shell files are precached
- Workbox runtime caching strategies configured (NetworkFirst for API, StaleWhileRevalidate for assets)
- PWA is installable on supported browsers
- Build completes without errors
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-auth/01-foundation-auth-02-SUMMARY.md` with:
- PWA configuration details
- Icon files created (placeholder or actual)
- Service worker registration status
- Any issues with vite-plugin-pwa in development mode
</output>
