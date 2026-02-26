import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

// Dev mode: use placeholder to prevent crash
// In production, this will fail gracefully
const url = convexUrl || (import.meta.env.DEV ? "https://placeholder.convex.cloud" : "");

if (!convexUrl && !import.meta.env.DEV) {
  console.warn("VITE_CONVEX_URL not set - backend will not work");
}

export const convex = new ConvexReactClient(url);
