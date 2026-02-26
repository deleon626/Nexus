import { SignIn, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router";

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
