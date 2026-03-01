import { ConvexHttpClient } from 'convex/browser';

const convexUrl = import.meta.env.VITE_CONVEX_URL;

// Dev mode: use placeholder to prevent crash
const url = convexUrl || (import.meta.env.DEV ? 'https://placeholder.convex.cloud' : '');

/**
 * Shared ConvexHttpClient for non-React code (e.g., sync worker).
 *
 * Unlike ConvexReactClient (hooks-based), this can be used in plain async
 * functions outside the React component tree.
 *
 * Phase 6: Enables sync worker to call Convex mutations directly.
 */
export const convexHttpClient = new ConvexHttpClient(url, {
  skipConvexDeploymentUrlCheck: true,
});
