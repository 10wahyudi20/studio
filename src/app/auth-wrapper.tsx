
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
    loadState();
    setIsAuthCheckComplete(true);
  }, [loadState]);

  React.useEffect(() => {
    if (isAuthCheckComplete && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isAuthCheckComplete, router]);

  if (!isAuthCheckComplete || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-2xl font-semibold text-primary">Memuat...</div>
        <Toaster />
      </div>
    );
  }

  return <>{children}</>;
}
