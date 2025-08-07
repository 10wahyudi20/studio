
"use client";

import React from "react";
import { useAppStore } from "@/hooks/use-app-store";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loadState } = useAppStore(state => ({
    isAuthenticated: state.isAuthenticated,
    loadState: state.loadState,
  }));
  const router = useRouter();
  const [isAuthCheckComplete, setIsAuthCheckComplete] = React.useState(false);

  React.useEffect(() => {
    loadState(); // Initial load
    
    const handleStorageChange = (event: StorageEvent) => {
      // If the main data store changes in another tab, reload our state
      if (event.key === 'clucksmart-state') {
        loadState();
      }
      // Handle auth changes separately to avoid a full reload just for auth
      if (event.key === 'clucksmart-auth') {
        const newAuthStatus = event.newValue === 'true';
        useAppStore.setState({ isAuthenticated: newAuthStatus });
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    setIsAuthCheckComplete(true);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
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
