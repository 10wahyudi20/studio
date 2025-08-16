
"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/hooks/use-app-store";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function LoginPage() {
  const { login, companyInfo, isAuthenticated } = useAppStore(state => ({
    login: state.login,
    companyInfo: state.companyInfo,
    isAuthenticated: state.isAuthenticated,
  }));
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasLoginError, setHasLoginError] = useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [isOnline, setIsOnline] = React.useState(true);
  
  useEffect(() => {
    setIsMounted(true);
    // Check network status on initial mount
    if (typeof navigator !== 'undefined') {
        setIsOnline(navigator.onLine);
    }
  }, []);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
      if (isMounted && isAuthenticated) {
          router.replace('/');
      }
  }, [isAuthenticated, isMounted, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setHasLoginError(false);

    // Short delay to show loading state
    setTimeout(() => {
        if (login(username, password)) {
            toast({ title: "Login Berhasil", description: "Selamat datang kembali!" });
            router.replace("/");
        } else {
            setHasLoginError(true);
            setIsBurning(true);
            toast({
                variant: "destructive",
                title: "Login Gagal",
                description: "Username atau password salah. Formulir dinonaktifkan sementara."
            });
            setTimeout(() => {
                setIsBurning(false);
                setHasLoginError(false);
            }, 15000); // 15 seconds cooldown
        }
        setIsLoading(false);
    }, 500);
  };
  
  if (!isMounted || isAuthenticated) {
    return null;
  }

  const backgroundStyle = companyInfo.loginBackground ? { backgroundImage: `url(${companyInfo.loginBackground})` } : {};
  const inputStyles = "bg-transparent border-white/30 placeholder:text-gray-300 dark:placeholder:text-gray-400 focus:ring-accent";
  
  return (
    <div 
      className={cn(
        "relative flex items-center justify-center min-h-screen bg-background p-4",
        companyInfo.loginBackground && "bg-cover bg-center"
      )}
      style={backgroundStyle}
    >
      <Card className={cn(
        "w-full max-w-xs bg-white/20 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-slate-500/30",
         isBurning && "card-burn-effect"
        )}>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Login</CardTitle>
          <CardDescription>Silakan masuk untuk melanjutkan ke dasbor Anda</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username Anda"
                className={inputStyles}
                disabled={isBurning}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
               <div className="relative">
                <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password Anda"
                    className={cn(inputStyles, hasLoginError && 'border-destructive')}
                    disabled={isBurning}
                />
                 <Button type="button" variant="ghost" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8 text-white/70 hover:text-white" onClick={() => setShowPassword(!showPassword)} disabled={isBurning}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Sembunyikan" : "Tampilkan"} password</span>
                </Button>
               </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || isBurning}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Masuk
            </Button>
          </CardFooter>
        </form>
      </Card>
      <div className="fixed bottom-4 right-4">
        <TooltipProvider>
            <Tooltip>
            <TooltipTrigger asChild>
                 <Button size="icon" variant="ghost" className="cursor-default bg-transparent border-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                    {isOnline ? (
                        <Wifi className="h-5 w-5 text-green-500" />
                    ) : (
                        <WifiOff className="h-5 w-5 text-red-500" />
                    )}
                    <span className="sr-only">{isOnline ? "Online" : "Offline"}</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Status: {isOnline ? "Online" : "Offline"}</p>
            </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
