import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { convex } from "./lib/convex";
import { publishableKey } from "./lib/clerk";

function App() {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold">Nexus QC Forms</h1>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            <p className="text-muted-foreground">Loading...</p>
          </main>
        </div>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

export default App;
