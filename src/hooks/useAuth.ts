import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

export type UserRole = 'admin' | 'worker' | 'reviewer' | 'viewer';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  role: UserRole | null;
  orgId: string | null;
}

// Check if we're in dev mode without real credentials
const isDevModeWithoutCredentials =
  import.meta.env.DEV &&
  (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || !import.meta.env.VITE_CONVEX_URL);

// Mock auth for dev mode - simulates an admin user
function useMockAuth(): AuthState {
  return {
    isAuthenticated: true,
    isLoading: false,
    userId: 'dev-user-123',
    role: 'admin', // Default to admin in dev mode for full access
    orgId: 'dev-org-123',
  };
}

export function useAuth() {
  // Use mock auth in dev mode without credentials
  const mockAuth = useMockAuth();
  const clerkAuth = useClerkAuth();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    userId: null,
    role: null,
    orgId: null,
  });

  useEffect(() => {
    // In dev mode without credentials, use mock auth
    if (isDevModeWithoutCredentials) {
      setAuthState(mockAuth);
      return;
    }

    const { isLoaded, userId, sessionClaims } = clerkAuth;

    if (!isLoaded) {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      return;
    }

    if (!userId) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        userId: null,
        role: null,
        orgId: null,
      });
      return;
    }

    // Extract role and orgId from Clerk session claims
    const claims = sessionClaims as any;
    const role = claims?.unsafeMetadata?.role as UserRole | undefined;
    const orgId = claims?.orgId as string | undefined;

    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      userId,
      role: role || null,
      orgId: orgId || null,
    });
  }, [clerkAuth, mockAuth]);

  return authState;
}

// Role checking utility for components
export function useRole() {
  const { role } = useAuth();

  return {
    isAdmin: role === 'admin',
    isWorker: role === 'worker' || role === 'admin', // Admins can access worker routes
    isReviewer: role === 'reviewer' || role === 'admin',
    isViewer: role === 'viewer',
    role,
  };
}

// Export the dev mode check for use in other components
export { isDevModeWithoutCredentials };
