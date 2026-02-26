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

export function useAuth() {
  const { isLoaded, userId, sessionClaims } = useClerkAuth();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    userId: null,
    role: null,
    orgId: null,
  });

  useEffect(() => {
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
    // Clerk metadata.role stores user role, orgId comes from Clerk Organizations
    const role = sessionClaims?.metadata?.role as UserRole | undefined;
    const orgId = sessionClaims?.orgId as string | undefined;

    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      userId,
      role: role || null,
      orgId: orgId || null,
    });
  }, [isLoaded, userId, sessionClaims]);

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
