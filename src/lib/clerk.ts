const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Dev mode: use placeholder key to prevent crash
// In production, this will be empty and Clerk will handle the redirect
export const publishableKey = clerkPubKey || (import.meta.env.DEV ? "pk_test_placeholder" : "");

if (!clerkPubKey && !import.meta.env.DEV) {
  console.warn("VITE_CLERK_PUBLISHABLE_KEY not set - auth will not work");
}
