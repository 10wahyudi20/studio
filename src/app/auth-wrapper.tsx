
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
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    // On initial mount, load the state from storage.
    // This will update isAuthenticated and trigger the next effect.
    loadState();
  }, [loadState]);

  React.useEffect(() => {
    // This effect runs after the initial state is loaded.
    if (isMounted) {
      if (!isAuthenticated) {
        // If not authenticated, redirect to login.
        router.replace('/login');
      } else {
        // If authenticated, mark the check as complete to render children.
        setIsAuthCheckComplete(true);
      }
    }
  }, [isAuthenticated, isMounted, router]);

  // While the component has not mounted or the auth check is not complete, show a loading screen.
  // This prevents a flash of the login page or unstyled content.
  if (!isMounted || !isAuthCheckComplete) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-2xl font-semibold text-primary">Memuat...</div>
        {/* Defer toaster rendering to client-side only */}
        {isMounted && <Toaster />}
      </div>
    );
  }

  // If check is complete and user is authenticated, render the children.
  return <>{children}</>;
}
