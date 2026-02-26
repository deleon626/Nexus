import { Routes, Route, Navigate } from "react-router";
import ProtectedRoute, { AdminRoute, WorkerRoute, ReviewerRoute } from "./protected";
import SignInPage from "./sign-in";
import AdminBuilder from "./admin/builder";
import { FormFillingPage } from "@/features/formFilling/pages/FormFillingPage";
import ReviewerDashboard from "./reviewer/dashboard";
import OfflineBanner from "../components/sync/OfflineBanner";
import SyncIndicator from "../components/sync/SyncIndicator";

// Error boundary for sync components
function SyncComponents() {
  try {
    return (
      <>
        <OfflineBanner />
        <header className="border-b bg-background">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold">Nexus QC Forms</h1>
            <SyncIndicator />
          </div>
        </header>
      </>
    );
  } catch (error) {
    return (
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-xl font-bold">Nexus QC Forms</h1>
        </div>
      </header>
    );
  }
}

export default function AppRoutes() {
  return (
    <ProtectedRoute>
      <SyncComponents />
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/" element={<Navigate to="/admin/builder" replace />} />
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
        <Route path="*" element={<Navigate to="/admin/builder" replace />} />
      </Routes>
    </ProtectedRoute>
  );
}
