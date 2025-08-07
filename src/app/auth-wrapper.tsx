
"use client";

import React from "react";
import { useAppStore } from "@/hooks/use-app-store";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const loadState = useAppStore(state => state.loadState);
  const router = useRouter();
  const [isAuthCheckComplete, setIsAuthCheckComplete] = React.useState(false);

  React.useEffect(() => {
    // This effect runs only once on mount to load state.
    // The isAuthenticated value will be updated after this runs.
    loadState();
    setIsAuthCheckComplete(true);
  }, [loadState]);

  React.useEffect(() => {
    // This effect runs whenever isAuthCheckComplete or isAuthenticated changes.
    // It handles the redirection logic.
    if (isAuthCheckComplete && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isAuthCheckComplete, router]);

  // While the auth check is not complete, show a loading screen.
  // Also show loading if the check is complete but the user is not authenticated,
  // because they will be redirected shortly. This prevents a flash of unstyled content.
  if (!isAuthCheckComplete || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-2xl font-semibold text-primary">Memuat...</div>
        {/* Using a random key to prevent hydration mismatch on the Toaster's aria-label */}
        <Toaster key={Math.random()} />
      </div>
    );
  }

  // If check is complete and user is authenticated, render the children.
  return <>{children}</>;
}
