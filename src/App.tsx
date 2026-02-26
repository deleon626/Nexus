import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { convex } from "./lib/convex";
import { publishableKey } from "./lib/clerk";
import AppRoutes from "./routes";

function App() {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AppRoutes />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

export default App;
