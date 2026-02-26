import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth, useRole } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const { isAdmin, isWorker, isReviewer } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return; // Wait for auth state to load

    if (!isAuthenticated) {
      // Redirect to sign-in if not authenticated
      navigate("/sign-in", { replace: true });
      return;
    }

    // Role-based routing after sign-in (per user decision)
    const currentPath = window.location.pathname;

    // If on root path, redirect to role-based dashboard
    if (currentPath === "/") {
      if (isAdmin) {
        navigate("/admin/builder", { replace: true });
      } else if (isWorker && !isAdmin) {
        navigate("/worker/forms", { replace: true });
      } else if (isReviewer && !isAdmin) {
        navigate("/reviewer/dashboard", { replace: true });
      } else {
        // Viewer or no role — show a default page
        navigate("/profile", { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, role, isAdmin, isWorker, isReviewer, navigate]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Don't render children if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

// Role-specific route wrappers (for future use)
export function AdminRoute({ children }: ProtectedRouteProps) {
  const { isAdmin } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate("/", { replace: true });
    }
  }, [isAdmin, navigate]);

  return isAdmin ? <>{children}</> : null;
}

export function WorkerRoute({ children }: ProtectedRouteProps) {
  const { isWorker } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isWorker) {
      navigate("/", { replace: true });
    }
  }, [isWorker, navigate]);

  return isWorker ? <>{children}</> : null;
}

export function ReviewerRoute({ children }: ProtectedRouteProps) {
  const { isReviewer } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isReviewer) {
      navigate("/", { replace: true });
    }
  }, [isReviewer, navigate]);

  return isReviewer ? <>{children}</> : null;
}
