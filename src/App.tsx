import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { convex } from "./lib/convex";
import { publishableKey } from "./lib/clerk";
import { MockAuthProvider, isDevModeWithoutCredentials } from "./context/AuthContext";
import { ClerkAuthProvider } from "./context/ClerkAuthProvider";
import AppRoutes from "./routes";

function App() {
  // In dev mode without credentials, use mock auth
  if (isDevModeWithoutCredentials) {
    return (
      <MockAuthProvider>
        <div className="min-h-screen bg-background">
          <div className="bg-yellow-500 text-black p-4 text-center text-sm">
            <strong>⚠ Dev Mode:</strong> Using mock authentication. Add{" "}
            <code className="bg-yellow-600 px-1 rounded">VITE_CONVEX_URL</code>{" "}
            to <code className="bg-yellow-600 px-1 rounded">.env.local</code> for real backend.
          </div>
          <AppRoutes />
        </div>
      </MockAuthProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ClerkAuthProvider>
          <div className="min-h-screen bg-background">
            <AppRoutes />
          </div>
        </ClerkAuthProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

export default App;
