---
created: 2026-02-26T18:58:25.041Z
title: Validate UI styling not being applied
area: ui
files:
  - tailwind.config.js:8-55
  - src/index.css:1-28
  - src/routes/admin/builder.tsx
---

## Problem

After adding Tailwind color theme mappings to `tailwind.config.js`, the form builder UI at `/admin/builder` shows only white background with no visible styling. The CSS variables are defined in `src/index.css` and the color mappings were added, but styles are not being applied to components.

Potential causes to investigate:
1. Dev server may need restart to pick up Tailwind config changes
2. CSS file may not be imported in main.tsx
3. Tailwind may not be processing the config correctly
4. Browser cache may need clearing

## Solution

1. Restart dev server (`npm run dev`)
2. Verify `src/index.css` is imported in `src/main.tsx`
3. Hard refresh browser (Cmd+Shift+R)
4. Check browser dev tools for CSS variable values
5. Verify Tailwind is generating the correct utility classes
