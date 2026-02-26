import { createContext, useContext, ReactNode } from 'react';

export type UserRole = 'admin' | 'worker' | 'reviewer' | 'viewer';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  role: UserRole | null;
  orgId: string | null;
}

interface RoleState {
  isAdmin: boolean;
  isWorker: boolean;
  isReviewer: boolean;
  isViewer: boolean;
  role: UserRole | null;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  isLoading: true,
  userId: null,
  role: null,
  orgId: null,
});

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export function useRole(): RoleState {
  const { role } = useAuth();
  return {
    isAdmin: role === 'admin',
    isWorker: role === 'worker' || role === 'admin',
    isReviewer: role === 'reviewer' || role === 'admin',
    isViewer: role === 'viewer',
    role,
  };
}

// Check if we're in dev mode without real credentials
export const isDevModeWithoutCredentials =
  import.meta.env.DEV &&
  (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || !import.meta.env.VITE_CONVEX_URL);

// Mock provider for dev mode
export function MockAuthProvider({ children }: { children: ReactNode }) {
  const mockAuth: AuthState = {
    isAuthenticated: true,
    isLoading: false,
    userId: 'dev-user-123',
    role: 'admin',
    orgId: 'dev-org-123',
  };

  return (
    <AuthContext.Provider value={mockAuth}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
