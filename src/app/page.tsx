"use client"

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Shield, Users, Target, LogIn, UserPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  React.useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary text-primary-foreground font-bold text-2xl mb-4 shadow-xl shadow-primary/20">
            CN
          </div>
          <h1 className="text-4xl font-headline font-bold tracking-tighter">CellNexus</h1>
          <p className="text-muted-foreground">Strategic Member Growth & Monitoring System</p>
        </div>

        <Tabs defaultValue="login" className="w-full" onValueChange={(v) => setAuthMode(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-secondary/50 p-1">
            <TabsTrigger value="login" className="gap-2">
              <LogIn className="size-4" />
              Sign In
            </TabsTrigger>
            <TabsTrigger value="register" className="gap-2">
              <UserPlus className="size-4" />
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="glass-card border-white/5">
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Authorize access to your tactical dashboard.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full h-14 text-lg font-semibold gap-3" 
                  onClick={() => login()}
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="size-6" />
                  Continue with Google
                </Button>
              </CardContent>
              <CardFooter className="flex justify-center border-t border-white/5 pt-6">
                <p className="text-xs text-muted-foreground text-center">
                  By signing in, you agree to our Terms of Operation.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="glass-card border-white/5">
              <CardHeader>
                <CardTitle>System Enrollment</CardTitle>
                <CardDescription>Select your initial clearance level (MVP Demo)</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-14 bg-secondary/20 hover:bg-secondary/40 border-white/5" 
                  onClick={() => login('Admin')}
                >
                  <Shield className="mr-3 size-5 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-sm leading-none mb-1">Administrator</p>
                    <p className="text-[10px] text-muted-foreground">Global oversight & system config</p>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-14 bg-secondary/20 hover:bg-secondary/40 border-white/5" 
                  onClick={() => login('Leader')}
                >
                  <Users className="mr-3 size-5 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-sm leading-none mb-1">Leader</p>
                    <p className="text-[10px] text-muted-foreground">Direct pod monitoring & coaching</p>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-14 bg-secondary/20 hover:bg-secondary/40 border-white/5" 
                  onClick={() => login('Member')}
                >
                  <Target className="mr-3 size-5 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-sm leading-none mb-1">Member</p>
                    <p className="text-[10px] text-muted-foreground">Personal growth map & targets</p>
                  </div>
                </Button>
              </CardContent>
              <CardFooter className="flex justify-center border-t border-white/5 pt-6">
                <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest">
                  Authentication via Google Secure Auth
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
