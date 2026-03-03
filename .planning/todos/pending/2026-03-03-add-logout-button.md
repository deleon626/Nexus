---
created: 2026-03-03T06:06:34.933Z
title: Add logout button
area: ui
files:
  - src/components/layout/AppLayout.tsx
  - src/context/ClerkAuthProvider.tsx
---

## Problem

The app has no logout button. Once a user signs in via Clerk, there is no UI element to sign out. Users need a way to end their session, likely in the sidebar/nav or settings page.

## Solution

Add a sign-out button using Clerk's `useClerk().signOut()` or `<SignOutButton />` component. Place it in the sidebar/nav layout (AppLayout) or settings page. After sign-out, redirect to `/sign-in`.
