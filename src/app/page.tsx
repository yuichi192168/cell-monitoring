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
  const [selectedRole, setSelectedRole] = useState<UserRole>('Leader');
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] sm:w-[40%] sm:h-[40%] bg-accent rounded-full blur-[100px] sm:blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] sm:w-[40%] sm:h-[40%] bg-primary rounded-full blur-[100px] sm:blur-[120px]" />
      </div>

      <div className="max-w-md w-full space-y-6 sm:space-y-8 relative z-10">
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-primary text-primary-foreground font-bold text-2xl sm:text-3xl mb-2 sm:mb-4 shadow-2xl shadow-primary/30">
            CN
          </div>
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-4xl sm:text-5xl font-headline font-black tracking-tighter text-foreground italic">CellNexus</h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium uppercase tracking-[0.2em]">Strategic Monitoring</p>
          </div>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8 bg-secondary/50 p-1 rounded-xl h-12 sm:h-14">
            <TabsTrigger value="login" className="gap-2 rounded-lg text-sm sm:text-base font-bold">
              <LogIn className="size-4" />
              Sign In
            </TabsTrigger>
            <TabsTrigger value="register" className="gap-2 rounded-lg text-sm sm:text-base font-bold">
              <UserPlus className="size-4" />
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="animate-in slide-in-from-bottom-4 duration-300">
            <Card className="glass-card border-white/5 rounded-2xl sm:rounded-3xl overflow-hidden">
              <form onSubmit={handleLogin}>
                <CardHeader className="space-y-1 p-6 sm:p-8">
                  <CardTitle className="text-2xl font-bold">Monitor Login</CardTitle>
                  <CardDescription className="text-sm">Access the tactical monitoring dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-5 px-6 sm:px-8">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input 
                        id="login-email"
                        type="email" 
                        placeholder="name@nexus.com" 
                        className="pl-11 h-12 sm:h-12 bg-secondary/30 rounded-xl"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input 
                        id="login-password"
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-11 h-12 sm:h-12 bg-secondary/30 rounded-xl"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-6 p-6 sm:p-8">
                  <Button type="submit" className="w-full h-14 text-base font-black rounded-xl shadow-lg shadow-primary/20" disabled={isSubmitting}>
                    {isSubmitting ? "Authenticating..." : "SIGN IN"}
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center uppercase tracking-[0.3em] font-bold">
                    Encrypted Protocol Active
                  </p>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register" className="animate-in slide-in-from-bottom-4 duration-300">
            <Card className="glass-card border-white/5 rounded-2xl sm:rounded-3xl overflow-hidden">
              <form onSubmit={handleRegister}>
                <CardHeader className="space-y-1 p-6 sm:p-8">
                  <CardTitle className="text-2xl font-bold">Monitor Enrollment</CardTitle>
                  <CardDescription className="text-sm">Initialize new monitor identity.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-5 px-6 sm:px-8">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input 
                        id="reg-name"
                        placeholder="John Doe" 
                        className="pl-11 h-12 sm:h-12 bg-secondary/30 rounded-xl"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input 
                        id="reg-email"
                        type="email" 
                        placeholder="name@nexus.com" 
                        className="pl-11 h-12 sm:h-12 bg-secondary/30 rounded-xl"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input 
                        id="reg-password"
                        type="password" 
                        placeholder="Min. 6 characters" 
                        className="pl-11 h-12 sm:h-12 bg-secondary/30 rounded-xl"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <div className="space-y-3 pt-2">
                    <Label className="text-xs uppercase tracking-widest font-black">Strategic Clearance Level</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        type="button"
                        variant={selectedRole === 'Leader' ? 'default' : 'outline'} 
                        className="h-10 text-[9px] sm:text-[10px] uppercase font-black rounded-lg"
                        onClick={() => setSelectedRole('Leader')}
                      >
                        Cell Leader
                      </Button>
                      <Button 
                        type="button"
                        variant={selectedRole === 'Admin' ? 'default' : 'outline'} 
                        className="h-10 text-[9px] sm:text-[10px] uppercase font-black rounded-lg"
                        onClick={() => setSelectedRole('Admin')}
                      >
                        Global Admin
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-6 p-6 sm:p-8">
                  <Button type="submit" className="w-full h-14 text-base font-black rounded-xl shadow-lg shadow-primary/20" disabled={isSubmitting}>
                    {isSubmitting ? "Enrolling..." : "INITIATE SESSION"}
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center italic">
                    Access is restricted to authorized tactical monitors.
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
