
"use client"

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, ShieldCheck, KeyRound } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { getFriendlyErrorMessage } from '@/lib/utils';
import { sendPasswordResetEmail, confirmPasswordReset } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';

export default function AuthPage() {
  const { login, register, user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Password Reset States
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'token'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

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
        description: getFriendlyErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await register(email, password, name, 'Leader');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: getFriendlyErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitiateReset = async () => {
    if (!resetEmail) return;
    setIsSubmitting(true);
    try {
      const { auth, db } = initializeFirebase();
      
      // Security: Check if user exists in our Firestore first
      const userRef = collection(db, 'users');
      const q = query(userRef, where('email', '==', resetEmail), limit(1));
      
      try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          toast({
            variant: "destructive",
            title: "Security Check",
            description: "This email is not registered in our system.",
          });
          setIsSubmitting(false);
          return;
        }
      } catch (permissionErr) {
        // Fallback: If rules still block, just proceed with Firebase default reset
        console.warn("Permission check skipped during reset flow.");
      }

      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: "Reset Token Sent",
        description: "A secure reset link has been sent to your email. Please check your inbox.",
      });
      setResetStep('token');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Security Check Failed",
        description: getFriendlyErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteReset = async () => {
    if (!resetToken || !newPassword) return;
    setIsSubmitting(true);
    
    // Capture email before clearing state
    const targetEmail = resetEmail;
    const targetPassword = newPassword;

    try {
      const { auth } = initializeFirebase();
      await confirmPasswordReset(auth, resetToken, targetPassword);
      
      // Close modal and reset modal specific states
      setIsResetOpen(false);
      setResetStep('email');
      setResetToken('');
      setNewPassword('');

      // Attempt automatic login
      try {
        await login(targetEmail, targetPassword);
        toast({
          title: "Account Recovered",
          description: "Your password was reset and you've been signed in automatically.",
        });
      } catch (loginErr) {
        // If auto-login fails for some reason, just show success for the reset
        toast({
          title: "Password Updated",
          description: "Your security credentials have been successfully reset. You can now sign in.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: "Invalid or expired token. Please try again.",
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
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] sm:w-[40%] sm:h-[40%] bg-accent rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] sm:w-[40%] sm:h-[40%] bg-primary rounded-full blur-[100px]" />
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary text-primary-foreground font-bold text-3xl mb-4 shadow-2xl shadow-primary/30">
            CGT
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-headline font-black tracking-tighter text-foreground italic">Cell Group Tracker</h1>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-[0.2em]">Secure Member Monitoring</p>
          </div>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-secondary/50 p-1 rounded-xl h-14">
            <TabsTrigger value="login" className="gap-2 rounded-lg text-base font-bold">
              <LogIn className="size-4" />
              Sign In
            </TabsTrigger>
            <TabsTrigger value="register" className="gap-2 rounded-lg text-base font-bold">
              <UserPlus className="size-4" />
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="animate-in slide-in-from-bottom-4 duration-300">
            <Card className="glass-card border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <form onSubmit={handleLogin}>
                <CardHeader className="space-y-1 p-8">
                  <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                  <CardDescription>Secure access to your growth dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 px-8">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input 
                        id="login-email"
                        type="email" 
                        placeholder="name@gmail.com" 
                        className="pl-11 h-12 bg-secondary/30 rounded-xl"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <button 
                        type="button" 
                        onClick={() => setIsResetOpen(true)}
                        className="text-[10px] text-accent font-bold hover:underline uppercase tracking-widest"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input 
                        id="login-password"
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-11 h-12 bg-secondary/30 rounded-xl"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-6 p-8">
                  <Button type="submit" className="w-full h-14 text-base font-black rounded-xl shadow-lg shadow-primary/20" disabled={isSubmitting}>
                    {isSubmitting ? "Authenticating..." : "SIGN IN"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register" className="animate-in slide-in-from-bottom-4 duration-300">
            <Card className="glass-card border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <form onSubmit={handleRegister}>
                <CardHeader className="space-y-1 p-8">
                  <CardTitle className="text-2xl font-bold">Create Leader Account</CardTitle>
                  <CardDescription>Begin tracking your group's spiritual journey.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 px-8">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input 
                        id="reg-name"
                        placeholder="Leader Name" 
                        className="pl-11 h-12 bg-secondary/30 rounded-xl"
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
                        placeholder="name@gmail.com" 
                        className="pl-11 h-12 bg-secondary/30 rounded-xl"
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
                        className="pl-11 h-12 bg-secondary/30 rounded-xl"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-6 p-8">
                  <Button type="submit" className="w-full h-14 text-base font-black rounded-xl shadow-lg shadow-primary/20" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "GET STARTED"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isResetOpen} onOpenChange={(open) => { setIsResetOpen(open); if(!open) setResetStep('email'); }}>
        <DialogContent className="rounded-[2.5rem] border-white/5 p-8 max-w-sm w-[95%]">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-black text-2xl flex items-center gap-2">
              <ShieldCheck className="size-6 text-accent" /> Reset Password
            </DialogTitle>
            <DialogDescription className="font-medium pt-2">
              {resetStep === 'email' 
                ? "Enter your email to receive a secure reset token." 
                : "Enter the token from your email and your new password."}
            </DialogDescription>
          </DialogHeader>

          {resetStep === 'email' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Email Address</Label>
                <Input 
                  placeholder="your@email.com" 
                  value={resetEmail} 
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="h-12 rounded-xl bg-secondary/30 border-none"
                />
              </div>
              <Button onClick={handleInitiateReset} disabled={isSubmitting} className="w-full h-14 font-black rounded-xl">
                {isSubmitting ? "Verifying..." : "SEND TOKEN"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Reset Token (from email)</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input 
                    placeholder="Enter Token Code" 
                    value={resetToken} 
                    onChange={(e) => setResetToken(e.target.value)}
                    className="h-12 rounded-xl bg-secondary/30 border-none pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input 
                    type="password"
                    placeholder="Min. 6 characters" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 rounded-xl bg-secondary/30 border-none pl-9"
                  />
                </div>
              </div>
              <Button onClick={handleCompleteReset} disabled={isSubmitting} className="w-full h-14 font-black rounded-xl">
                {isSubmitting ? "Updating..." : "RESET PASSWORD"}
              </Button>
              <button 
                onClick={() => setResetStep('email')} 
                className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to email
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
