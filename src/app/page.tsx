
"use client"

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Shield, Users, Target, LogIn, UserPlus, Mail, Lock, User as UserIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function AuthPage() {
  const { login, register, user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Member');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await register(email, password, name, selectedRole);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Could not create account. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-4xl font-headline font-bold tracking-tighter text-foreground">CellNexus</h1>
          <p className="text-muted-foreground">Strategic Member Growth & Monitoring System</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
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
              <form onSubmit={handleLogin}>
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>Enter your credentials to access the tactical dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input 
                        id="login-email"
                        type="email" 
                        placeholder="name@example.com" 
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input 
                        id="login-password"
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isSubmitting}>
                    {isSubmitting ? "Authenticating..." : "Sign In"}
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest">
                    Secure encrypted authentication
                  </p>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="glass-card border-white/5">
              <form onSubmit={handleRegister}>
                <CardHeader>
                  <CardTitle>System Enrollment</CardTitle>
                  <CardDescription>Create your account and select clearance level.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input 
                        id="reg-name"
                        placeholder="John Doe" 
                        className="pl-10"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input 
                        id="reg-email"
                        type="email" 
                        placeholder="name@example.com" 
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input 
                        id="reg-password"
                        type="password" 
                        placeholder="Min. 6 characters" 
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Initial Clearance Level</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        type="button"
                        variant={selectedRole === 'Member' ? 'default' : 'outline'} 
                        className="h-10 text-[10px] uppercase font-bold"
                        onClick={() => setSelectedRole('Member')}
                      >
                        Member
                      </Button>
                      <Button 
                        type="button"
                        variant={selectedRole === 'Leader' ? 'default' : 'outline'} 
                        className="h-10 text-[10px] uppercase font-bold"
                        onClick={() => setSelectedRole('Leader')}
                      >
                        Leader
                      </Button>
                      <Button 
                        type="button"
                        variant={selectedRole === 'Admin' ? 'default' : 'outline'} 
                        className="h-10 text-[10px] uppercase font-bold"
                        onClick={() => setSelectedRole('Admin')}
                      >
                        Admin
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isSubmitting}>
                    {isSubmitting ? "Enrolling..." : "Complete Enrollment"}
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    By enrolling, you agree to the Terms of Operation.
                  </p>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
