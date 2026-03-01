import { Routes, Route, Navigate } from "react-router";
import { useRole, isDevModeWithoutCredentials } from "../context/AuthContext";
import ProtectedRoute, { AdminRoute, WorkerRoute, ReviewerRoute } from "./protected";
import SignInPage from "./sign-in";
import AdminBuilder from "./admin/builder";
import { FormFillingPage } from "@/features/formFilling/pages/FormFillingPage";
import ReviewerDashboard from "./reviewer/dashboard";
import SettingsPage from "./settings";
import OfflineBanner from "../components/sync/OfflineBanner";
import AppLayout from "../components/layout/AppLayout";

// Role-based home component that redirects users to their appropriate default route
function RoleBasedHome() {
  const { isAdmin, isWorker, isReviewer } = useRole();

  if (isDevModeWithoutCredentials || isAdmin) {
    return <Navigate to="/admin/builder" replace />;
  }
  if (isWorker) {
    return <Navigate to="/worker/forms" replace />;
  }
  if (isReviewer) {
    return <Navigate to="/reviewer/dashboard" replace />;
  }

  // No role — show within the AppLayout (sidebar shows "Contact your admin")
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-lg font-medium mb-2">No access assigned</p>
      <p className="text-muted-foreground text-sm">Contact your admin to get access to this application.</p>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <ProtectedRoute>
      <OfflineBanner />
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<RoleBasedHome />} />
          <Route
            path="/admin/builder"
            element={
              <AdminRoute>
                <AdminBuilder />
              </AdminRoute>
            }
          />
          <Route
            path="/worker/forms"
            element={
              <WorkerRoute>
                <FormFillingPage />
              </WorkerRoute>
            }
          />
          <Route
            path="/reviewer/dashboard"
            element={
              <ReviewerRoute>
                <ReviewerDashboard />
              </ReviewerRoute>
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
}
