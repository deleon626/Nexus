import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { useAuth, useRole, isDevModeWithoutCredentials } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDevModeWithoutCredentials) return;
    if (isLoading) return;
    if (!isAuthenticated) navigate("/sign-in", { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  if (isDevModeWithoutCredentials) return <Outlet />;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <Outlet />;
}

export function AdminRoute() {
  const { isAdmin } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDevModeWithoutCredentials) return;
    if (!isAdmin) navigate("/", { replace: true });
  }, [isAdmin, navigate]);

  if (isDevModeWithoutCredentials) return <Outlet />;
  return isAdmin ? <Outlet /> : null;
}

export function WorkerRoute() {
  const { isWorker } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDevModeWithoutCredentials) return;
    if (!isWorker) navigate("/", { replace: true });
  }, [isWorker, navigate]);

  if (isDevModeWithoutCredentials) return <Outlet />;
  return isWorker ? <Outlet /> : null;
}

export function ReviewerRoute() {
  const { isReviewer } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDevModeWithoutCredentials) return;
    if (!isReviewer) navigate("/", { replace: true });
  }, [isReviewer, navigate]);

  if (isDevModeWithoutCredentials) return <Outlet />;
  return isReviewer ? <Outlet /> : null;
}
