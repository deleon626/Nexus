import { ReactNode, useEffect, useState } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { AuthContext, UserRole, AuthState } from './AuthContext';

const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  userId: null,
  role: null,
  orgId: null,
};

export function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, userId, sessionClaims } = useClerkAuth();
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);

  useEffect(() => {
    if (!isLoaded) {
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: true }));
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
    const claims = sessionClaims as { unsafeMetadata?: { role?: UserRole }; orgId?: string };
    const role = claims?.unsafeMetadata?.role;
    const orgId = claims?.orgId;

    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      userId,
      role: role || null,
      orgId: orgId || null,
    });
  }, [isLoaded, userId, sessionClaims]);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}
