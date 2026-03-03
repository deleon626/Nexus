import { SignIn } from "@clerk/clerk-react";
import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router";
import { useAuth, isDevModeWithoutCredentials } from "@/context/AuthContext";

export default function SignInPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // In dev mode, redirect immediately (mock is always authenticated)
  if (isDevModeWithoutCredentials) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Nexus QC Forms</h1>
          <p className="text-muted-foreground mt-2">Sign in to continue</p>
        </div>
        <SignIn
          fallbackRedirectUrl="/"
          routing="path"
          path="/sign-in"
        />
      </div>
    </div>
  );
}
