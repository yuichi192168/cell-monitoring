
"use client"

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Shield, Users, Target } from 'lucide-react';

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary text-primary-foreground font-bold text-2xl mb-4">
            CN
          </div>
          <h1 className="text-4xl font-headline font-bold tracking-tighter">CellNexus</h1>
          <p className="text-muted-foreground">Strategic Member Growth & Monitoring System</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Authorize via Google and select initial role (MVP Demo)</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button 
              variant="outline" 
              className="w-full justify-start h-14" 
              onClick={() => login('Admin')}
            >
              <Shield className="mr-3 size-5" />
              <div className="text-left">
                <p className="font-medium">Administrator</p>
                <p className="text-xs text-muted-foreground">Full system control</p>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-14" 
              onClick={() => login('Leader')}
            >
              <Users className="mr-3 size-5" />
              <div className="text-left">
                <p className="font-medium">Leader</p>
                <p className="text-xs text-muted-foreground">Manage assigned cell members</p>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-14" 
              onClick={() => login('Member')}
            >
              <Target className="mr-3 size-5" />
              <div className="text-left">
                <p className="font-medium">Member</p>
                <p className="text-xs text-muted-foreground">View personal milestones</p>
              </div>
            </Button>
          </CardContent>
          <CardFooter className="text-center">
            <p className="text-xs text-muted-foreground w-full">
              Authentication powered by Firebase Identity
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
