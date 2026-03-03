import { ReactNode, useEffect, useState } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { AuthContext, UserRole, AuthState } from './AuthContext';

const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  userId: null,
  role: null,
  orgId: null,
  userName: null,
  userImageUrl: null,
};

export function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, userId, sessionClaims } = useClerkAuth();
  const { user } = useUser();
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);

  useEffect(() => {
    if (!isLoaded) {
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: true }));
      return;
    }

    if (!userId) {
      setAuthState({
        ...initialAuthState,
        isLoading: false,
      });
      return;
    }

    // Extract role from user's unsafeMetadata and orgId from session claims
    const metadata = user?.unsafeMetadata as { role?: UserRole } | undefined;
    const role = metadata?.role;
    const orgId = (sessionClaims as { orgId?: string })?.orgId;

    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      userId,
      role: role || null,
      orgId: orgId || null,
      userName: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || null,
      userImageUrl: user?.imageUrl ?? null,
    });
  }, [isLoaded, userId, sessionClaims, user?.firstName, user?.lastName, user?.imageUrl]);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}
