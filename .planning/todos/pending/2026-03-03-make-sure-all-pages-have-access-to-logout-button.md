---
created: 2026-03-03T08:40:51.406Z
title: Make sure all pages have access to logout button
area: ui
files: []
---

## Problem

The logout button may not be accessible from all pages in the application. Users should be able to log out from any page they navigate to, not just specific ones. This ensures a consistent and secure user experience — users should never feel "trapped" without a way to sign out.

## Solution

Audit all pages/routes and ensure the logout button is present in a shared layout or navigation component that wraps all authenticated pages. If a global layout/navbar exists, add the logout button there. If not, identify the common ancestor and add it.
