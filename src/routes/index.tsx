import { Routes, Route, Navigate } from "react-router";
import ProtectedRoute, { AdminRoute, WorkerRoute, ReviewerRoute } from "./protected";
import SignInPage from "./sign-in";
import AdminBuilder from "./admin/builder";
import WorkerForms from "./worker/forms";
import ReviewerDashboard from "./reviewer/dashboard";
import OfflineBanner from "../components/sync/OfflineBanner";
import SyncIndicator from "../components/sync/SyncIndicator";

export default function AppRoutes() {
  return (
    <ProtectedRoute>
      <OfflineBanner />
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">Nexus QC Forms</h1>
          <SyncIndicator />
        </div>
      </header>
      <Routes>
        {/* Sign-in route (outside protected wrapper, but handled by ProtectedRoute) */}
        <Route path="/sign-in" element={<SignInPage />} />

        {/* Root redirects to role-based dashboard (handled by ProtectedRoute) */}
        <Route path="/" element={<Navigate to="/" replace />} />

        {/* Role-specific routes */}
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
              <WorkerForms />
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

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ProtectedRoute>
  );
}
