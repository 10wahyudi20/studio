
"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/hooks/use-app-store";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const DuckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M11.372 13.061C11.12 12.56 10.636 12 10.001 12c-.552 0-1 .448-1 1s.449 1 1 1c.552 0 1.135-.448 1.499-1.24.331.144.69.24 1.059.24 1.381 0 2.5-1.119 2.5-2.5s-1.119-2.5-2.5-2.5c-1.282 0-2.343.967-2.484 2.212C12.19 11.08 12 10.562 12 10c0-1.339 1.01-2.433 2.288-2.494C14.624 5.438 16.657 4 19.001 4c2.761 0 5 2.239 5 5s-2.239 5-5 5c-1.636 0-3.111-.79-4.029-2.035a3.465 3.465 0 0 1-1.21.285c-1.112 0-2.11-.539-2.73-1.378a3.53 3.53 0 0 1-.66.814C4.249 13.921 2 14.058 2 12.5c0-.663.486-1.22 1.123-1.428.21-.069.428-.103.649-.103.422 0 .821.143 1.145.404.223.18.423.388.599.615a4.52 4.52 0 0 0 .543.61c.45.494 1.066.8 1.741.8.498 0 .97-.158 1.372-.439z" />
    </svg>
);

export default function LoginPage() {
  const { login, companyInfo, loadState, isAuthenticated } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load state on component mount to get credentials
  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isMounted && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isMounted, router]);


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      if (login(username, password)) {
        toast({ title: "Login Berhasil", description: "Selamat datang kembali!" });
        router.push("/");
      } else {
        toast({ variant: "destructive", title: "Login Gagal", description: "Username atau password salah." });
        setIsLoading(false);
      }
    }, 500); // Simulate network delay
  };
  
  // Wait until mount is complete to avoid hydration mismatch
  if (!isMounted) {
     return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="text-2xl font-semibold text-primary">Memuat...</div>
        </div>
    );
  }

  // This check prevents rendering on the server if not authenticated, avoiding hydration mismatch for background image
  if (isAuthenticated) {
    return null;
  }

  const backgroundStyle = companyInfo.loginBackground 
  ? { backgroundImage: `url(${companyInfo.loginBackground})` }
  : {};

  const inputStyles = "bg-transparent border-white/30 placeholder:text-gray-300 dark:placeholder:text-gray-400 focus:ring-accent";

  return (
    <div 
      className={cn(
          "flex items-center justify-center min-h-screen bg-background p-4",
          companyInfo.loginBackground && "bg-cover bg-center"
      )}
      style={backgroundStyle}
    >
      <Card className="w-full max-w-sm bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/30 dark:border-slate-500/30">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4">
                <DuckIcon className="h-16 w-16 text-primary" />
            </div>
          <CardTitle className="animated-rainbow-text">LOGIN</CardTitle>
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
                required
                placeholder="Username Anda"
                className={inputStyles}
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
                    required
                    placeholder="Password Anda"
                    className={inputStyles}
                />
                 <Button type="button" variant="ghost" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8 text-white/70 hover:text-white" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Sembunyikan" : "Tampilkan"} password</span>
                </Button>
               </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Masuk
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
