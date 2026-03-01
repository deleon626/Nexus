import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProvider } from "convex/react";
import { convex } from "./lib/convex";
import { publishableKey } from "./lib/clerk";
import { MockAuthProvider, isDevModeWithoutCredentials } from "./context/AuthContext";
import { ClerkAuthProvider } from "./context/ClerkAuthProvider";
import AppRoutes from "./routes";
import { ReloadPrompt } from "./features/pwa/components/ReloadPrompt";
import { InstallPrompt } from "./features/pwa/components/InstallPrompt";

function App() {
  // TEMP: Force dev mode for self-hosted Convex debugging
  const forceDevMode = import.meta.env.DEV;

  // In dev mode without credentials, use mock auth
  if (forceDevMode || isDevModeWithoutCredentials) {
    return (
      <ConvexProvider client={convex}>
        <MockAuthProvider>
          <div className="min-h-screen bg-background">
            <div className="bg-yellow-500 text-black p-4 text-center text-sm">
              <strong>⚠ Dev Mode:</strong> Using mock authentication. Add{" "}
              <code className="bg-yellow-600 px-1 rounded">VITE_CONVEX_URL</code>{" "}
              to <code className="bg-yellow-600 px-1 rounded">.env.local</code> for real backend.
            </div>
            <AppRoutes />
            <ReloadPrompt />
            <InstallPrompt />
          </div>
        </MockAuthProvider>
      </ConvexProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ClerkAuthProvider>
          <div className="min-h-screen bg-background">
            <AppRoutes />
            <ReloadPrompt />
            <InstallPrompt />
          </div>
        </ClerkAuthProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

export default App;
