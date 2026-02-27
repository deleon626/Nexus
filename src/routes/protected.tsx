import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth, useRole, isDevModeWithoutCredentials } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const { isAdmin, isWorker, isReviewer } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    // In dev mode without credentials, skip all auth checks
    if (isDevModeWithoutCredentials) return;

    if (isLoading) return;

    if (!isAuthenticated) {
      navigate("/sign-in", { replace: true });
      return;
    }

    // Role-based redirect logic is now handled by RoleBasedHome component in index.tsx
  }, [isAuthenticated, isLoading, navigate]);

  // In dev mode, always show children
  if (isDevModeWithoutCredentials) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

// Role-specific route wrappers
export function AdminRoute({ children }: ProtectedRouteProps) {
  const { isAdmin } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDevModeWithoutCredentials) return;
    if (!isAdmin) {
      navigate("/", { replace: true });
    }
  }, [isAdmin, navigate]);

  if (isDevModeWithoutCredentials) return <>{children}</>;
  return isAdmin ? <>{children}</> : null;
}

export function WorkerRoute({ children }: ProtectedRouteProps) {
  const { isWorker } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDevModeWithoutCredentials) return;
    if (!isWorker) {
      navigate("/", { replace: true });
    }
  }, [isWorker, navigate]);

  if (isDevModeWithoutCredentials) return <>{children}</>;
  return isWorker ? <>{children}</> : null;
}

export function ReviewerRoute({ children }: ProtectedRouteProps) {
  const { isReviewer } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDevModeWithoutCredentials) return;
    if (!isReviewer) {
      navigate("/", { replace: true });
    }
  }, [isReviewer, navigate]);

  if (isDevModeWithoutCredentials) return <>{children}</>;
  return isReviewer ? <>{children}</> : null;
}
