
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
    // Initial load from storage on component mount
    loadState();
    
    // Add event listener for storage changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      // Reload state if the main data or auth status changes in another tab
      if (event.key === 'clucksmart-state' || event.key === 'clucksmart-auth') {
        loadState();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    // Set auth check to complete after initial load
    setIsAuthCheckComplete(true);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadState]); // Dependency on loadState ensures the latest function version is used


  React.useEffect(() => {
    // This effect runs after the initial state is loaded or updated.
    // It is responsible for redirecting if needed.
    if (isAuthCheckComplete && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isAuthCheckComplete, router]);

  // While the auth check is not complete, or if the user is not authenticated, show a loading screen.
  // This prevents a flash of the login page or unstyled content.
  if (!isAuthCheckComplete || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-2xl font-semibold text-primary">Memuat...</div>
        <Toaster />
      </div>
    );
  }

  // If check is complete and user is authenticated, render the children.
  return <>{children}</>;
}
