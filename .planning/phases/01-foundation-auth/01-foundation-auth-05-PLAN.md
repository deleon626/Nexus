---
phase: 01-foundation-auth
plan: 05
type: execute
wave: 3
depends_on: ["01-foundation-auth-04"]
files_modified:
  - src/routes/index.tsx
  - src/routes/sign-in.tsx
  - src/routes/protected.tsx
  - src/routes/admin/builder.tsx
  - src/routes/worker/forms.tsx
  - src/routes/reviewer/dashboard.tsx
  - src/hooks/useAuth.ts
  - src/App.tsx
  - src/main.tsx
autonomous: true
requirements:
  - AUTH-01
  - AUTH-02
user_setup: []

must_haves:
  truths:
    - "Unauthenticated users are redirected to /sign-in"
    - "Users can sign in via Clerk (full-page redirect)"
    - "After sign-in, users redirect to role-based dashboard"
    - "Admin users can access /admin/builder route"
    - "Worker users can access /worker/forms route"
    - "Reviewer users can access /reviewer/dashboard route"
  artifacts:
    - path: "src/routes/sign-in.tsx"
      provides: "Clerk sign-in page with full-page redirect"
      contains: "SignIn, RedirectToSignIn"
    - path: "src/routes/protected.tsx"
      provides: "Protected route wrapper with auth check"
      contains: "useAuth, redirect"
    - path: "src/hooks/useAuth.ts"
      provides: "Auth state and role checking hook"
      contains: "useAuth, checkRole"
    - path: "src/routes/admin/builder.tsx"
      provides: "Admin dashboard route (placeholder)"
    - path: "src/routes/worker/forms.tsx"
      provides: "Worker dashboard route (placeholder)"
    - path: "src/routes/reviewer/dashboard.tsx"
      provides: "Reviewer dashboard route (placeholder)"
  key_links:
    - from: "src/routes/protected.tsx"
      to: "src/hooks/useAuth.ts"
      via: "Auth checking hook"
      pattern: "useAuth|checkRole"
    - from: "src/routes/sign-in.tsx"
      to: "Clerk"
      via: "SignIn component"
      pattern: "SignIn.*RedirectToSignIn"

---

<objective>
Implement protected routing with Clerk sign-in flow and role-based dashboard routing. Create sign-in page, protected route wrapper, auth hooks, and role-based dashboard routes (Admin → Builder, Worker → Forms, Reviewer → Dashboard).

Purpose: AUTH-01 requires Clerk sign-in, AUTH-02 requires role-based access. This plan implements the routing layer that enforces authentication requirements and directs users to appropriate dashboards based on their role.

Output: Sign-in page with Clerk integration, protected route component, role-based auth hook, dashboard routes for each role, role-based redirect after sign-in.
</object>

<execution_context>
@/Users/dennyleonardo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dennyleonardo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-foundation-auth/01-CONTEXT.md
@.planning/phases/01-foundation-auth/01-RESEARCH.md

# Research patterns to follow:
# - Clerk SignIn component for full-page redirect (per user decision)
# - useAuth() hook for auth state and role checking
# - React Router v7 for routing (use React.useNavigate for redirects)
# - Role-based routing: Admin → /admin/builder, Worker → /worker/forms, Reviewer → /reviewer/dashboard
</context>

<tasks>

<task type="auto">
  <name>Create auth hook with role checking</name>
  <files>src/hooks/useAuth.ts</files>
  <action>
Create **src/hooks/useAuth.ts** with auth state and role checking utilities:

```typescript
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

export type UserRole = 'admin' | 'worker' | 'reviewer' | 'viewer';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  role: UserRole | null;
  orgId: string | null;
}

export function useAuth() {
  const { isLoaded, userId, sessionClaims } = useClerkAuth();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    userId: null,
    role: null,
    orgId: null,
  });

  useEffect(() => {
    if (!isLoaded) {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      return;
    }

    if (!userId) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        userId: null,
        role: null,
        orgId: null,
      });
      return;
    }

    // Extract role and orgId from Clerk session claims
    // Clerk metadata.role stores user role, orgId comes from Clerk Organizations
    const role = sessionClaims?.metadata?.role as UserRole | undefined;
    const orgId = sessionClaims?.orgId as string | undefined;

    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      userId,
      role: role || null,
      orgId: orgId || null,
    });
  }, [isLoaded, userId, sessionClaims]);

  return authState;
}

// Role checking utility for components
export function useRole() {
  const { role } = useAuth();

  return {
    isAdmin: role === 'admin',
    isWorker: role === 'worker' || role === 'admin', // Admins can access worker routes
    isReviewer: role === 'reviewer' || role === 'admin',
    isViewer: role === 'viewer',
    role,
  };
}
```

Create the **src/hooks/** directory if it doesn't exist.

Note: Clerk Organizations provides orgId in sessionClaims. The role is stored in user.publicMetadata.role and accessed via sessionClaims.metadata.role.
  </action>
  <verify>grep -q "function useAuth" src/hooks/useAuth.ts && grep -q "function useRole" src/hooks/useAuth.ts && grep -q "UserRole" src/hooks/useAuth.ts</verify>
  <done>Auth hook with role checking created</done>
</task>

<task type="auto">
  <name>Create sign-in page with Clerk integration</name>
  <files>src/routes/sign-in.tsx</files>
  <action>
Create **src/routes/sign-in.tsx** with Clerk sign-in component:

```tsx
import { SignIn, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SignInPage() {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to role-based dashboard if already signed in
    if (isSignedIn) {
      navigate("/", { replace: true });
    }
  }, [isSignedIn, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Nexus QC Forms</h1>
          <p className="text-muted-foreground mt-2">Sign in to continue</p>
        </div>
        <SignIn
          afterSignInUrl="/"
          signUpUrl="/sign-up"
          routing="path"
          path="/sign-in"
        />
      </div>
    </div>
  );
}
```

This follows the user decision for full-page redirect to Clerk sign-in widget with app logo. The SignIn component is provided by Clerk and handles the entire sign-in flow.
  </action>
  <verify>grep -q "SignIn" src/routes/sign-in.tsx && grep -q "useUser" src/routes/sign-in.tsx && grep -q "afterSignInUrl" src/routes/sign-in.tsx</verify>
  <done>Sign-in page with Clerk integration created</done>
</task>

<task type="auto">
  <name>Create protected route wrapper with role-based redirect</name>
  <files>src/routes/protected.tsx</files>
  <action>
Create **src/routes/protected.tsx** with protected route wrapper and role-based dashboard routing:

```tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
```

This implements AUTH-02 role-based access control with role-specific route wrappers.
  </action>
  <verify>grep -q "function ProtectedRoute" src/routes/protected.tsx && grep -q "useAuth" src/routes/protected.tsx && grep -q "navigate.*admin/builder" src/routes/protected.tsx</verify>
  <done>Protected route wrapper with role-based routing created</done>
</task>

<task type="auto">
  <name>Create role-based dashboard routes (placeholders)</name>
  <files>src/routes/admin/builder.tsx, src/routes/worker/forms.tsx, src/routes/reviewer/dashboard.tsx</files>
  <action>
Create placeholder dashboard routes for each role:

**src/routes/admin/builder.tsx:**
```tsx
export default function AdminBuilder() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Form Builder</h1>
      <p className="text-muted-foreground mt-4">Admin dashboard — coming soon in Phase 2</p>
    </div>
  );
}
```

**src/routes/worker/forms.tsx:**
```tsx
export default function WorkerForms() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">My Forms</h1>
      <p className="text-muted-foreground mt-4">Worker dashboard — coming soon in Phase 3</p>
    </div>
  );
}
```

**src/routes/reviewer/dashboard.tsx:**
```tsx
export default function ReviewerDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Review Dashboard</h1>
      <p className="text-muted-foreground mt-4">Reviewer dashboard — coming soon in Phase 4</p>
    </div>
  );
}
```

Create the directory structure: **src/routes/admin/**, **src/routes/worker/**, **src/routes/reviewer/**
  </action>
  <verify>[ -f src/routes/admin/builder.tsx ] && [ -f src/routes/worker/forms.tsx ] && [ -f src/routes/reviewer/dashboard.tsx ]</verify>
  <done>Role-based dashboard routes created as placeholders</done>
</task>

<task type="auto">
  <name>Set up React Router and integrate protected routes</name>
  <files>src/App.tsx, src/main.tsx, src/routes/index.tsx</files>
  <action>
Install React Router v7 and set up routing:

```bash
npm install react-router
```

Update **src/main.tsx** to wrap with BrowserRouter:
```tsx
import { StrictMode } from 'react'
import { BrowserRouter } from 'react-router'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

Create **src/routes/index.tsx** with route definitions:
```tsx
import { Routes, Route, Navigate } from "react-router";
import ProtectedRoute, { AdminRoute, WorkerRoute, ReviewerRoute } from "./protected";
import SignInPage from "./sign-in";
import AdminBuilder from "./admin/builder";
import WorkerForms from "./worker/forms";
import ReviewerDashboard from "./reviewer/dashboard";

export default function AppRoutes() {
  return (
    <ProtectedRoute>
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
```

Update **src/App.tsx** to use AppRoutes:
```tsx
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
```
  </action>
  <verify>grep -q "BrowserRouter" src/main.tsx && grep -q "Routes.*Route" src/routes/index.tsx && grep -q "AppRoutes" src/App.tsx</verify>
  <done>React Router configured with protected routes</done>
</task>

</tasks>

<verification>
After completing all tasks:

1. Run `npm run dev`
2. Visit http://localhost:5173 — should redirect to /sign-in
3. Click sign-in (will show Clerk sign-in page)
4. After signing in, should redirect to role-based dashboard based on user role
5. Try accessing /admin/builder directly — should work for admin users, redirect for others
6. Check TypeScript compilation: `npx tsc --noEmit`
7. Verify no console errors during sign-in flow

Note: For testing, you'll need a Clerk account with roles set in user metadata. The role field comes from `publicMetadata.role` in Clerk.
</verification>

<success_criteria>
- Sign-in page renders with Clerk SignIn component
- Unauthenticated users redirected to /sign-in
- After sign-in, users redirect to role-based dashboard
- Role-specific routes are protected (admin only for /admin/builder, etc.)
- React Router configured with BrowserRouter
- ProtectedRoute wrapper enforces auth and role checks
- No TypeScript or runtime errors
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-auth/01-foundation-auth-05-SUMMARY.md` with:
- Routing structure details
- Role-based access control implementation
- Sign-in flow description
- Next steps: Plan 06 (Offline sync engine)
</output>
