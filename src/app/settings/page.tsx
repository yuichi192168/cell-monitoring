
"use client"

import React, { useState, useEffect } from 'react';
import { LayoutShell } from '@/components/layout-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { User as UserIcon, Mail, Phone, Shield, Calendar, Activity, Lock, Save, Camera } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';

export default function SettingsPage() {
  const { user: authUser } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const userRef = authUser ? doc(db, 'users', authUser.id) : null;
  const { data: userData, loading } = useDoc(userRef);

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Password change state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setPhoneNumber(userData.phoneNumber || '');
    }
  }, [userData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRef) return;

    setIsUpdating(true);
    try {
      await updateDoc(userRef, {
        name,
        phoneNumber,
      });
      toast({
        title: "Profile Updated",
        description: "Your information has been successfully saved.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update profile.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "New passwords do not match.",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Password must be at least 6 characters.",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const user = (await import('@/firebase')).initializeFirebase().auth.currentUser;
      if (!user || !user.email) throw new Error("No authenticated user found.");

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      setIsPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Change Failed",
        description: error.message || "Could not change password. Check your current password.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading || !userData) {
    return (
      <LayoutShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </LayoutShell>
    );
  }

  const getRoleDisplay = (role: string) => {
    if (role === 'Admin') return 'Primary Leader';
    if (role === 'Leader') return 'Cell Leader';
    return 'Cell Member';
  };

  return (
    <LayoutShell>
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-headline font-bold">Profile Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account details and security preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Card className="glass-card">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="relative inline-block">
                  <div className="h-24 w-24 rounded-full bg-secondary border border-border flex items-center justify-center mx-auto overflow-hidden">
                    <UserIcon className="size-10 text-muted-foreground" />
                  </div>
                  <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg border">
                    <Camera className="size-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">{userData.name}</h3>
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-widest px-3 py-0.5 font-black">
                    {getRoleDisplay(userData.role)}
                  </Badge>
                </div>
                <Separator />
                <div className="space-y-3 pt-2 text-left">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Calendar className="size-4" />
                    <span>Joined {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Recently'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Activity className="size-4" />
                    <span className="flex items-center gap-1.5">
                      Status: <Badge variant="outline" className="text-[10px] h-5 py-0">{userData.status || 'Active'}</Badge>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Shield className="size-4 text-accent" /> Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 h-11 text-sm font-medium"
                  onClick={() => setIsPasswordDialogOpen(true)}
                >
                  <Lock className="size-4" />
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="glass-card">
              <form onSubmit={handleUpdateProfile}>
                <CardHeader>
                  <CardTitle className="text-lg">Account Information</CardTitle>
                  <CardDescription>Update your personal details below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input 
                        id="full-name" 
                        className="pl-9"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        className="pl-9 bg-secondary/30"
                        value={userData.email}
                        disabled
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Contact your administrator to change your email.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input 
                        id="phone" 
                        type="tel"
                        className="pl-9"
                        placeholder="+63 928 2346 158"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label>Role</Label>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/20 border text-sm font-medium">
                      <Shield className="size-4 text-accent" />
                      {getRoleDisplay(userData.role)}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-secondary/10 border-t mt-4 flex justify-end py-4">
                  <Button type="submit" className="gap-2 h-11" disabled={isUpdating}>
                    <Save className="size-4" />
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <div className="mt-8 p-6 rounded-2xl border border-dashed text-center space-y-3">
              <h4 className="text-sm font-bold">Need help?</h4>
              <p className="text-xs text-muted-foreground">If you have any issues with your account, please contact the Primary Leader for support.</p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Password</DialogTitle>
            <DialogDescription>
              Enter your current password to set a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="curr-pass">Current Password</Label>
              <Input 
                id="curr-pass" 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="new-pass">New Password</Label>
              <Input 
                id="new-pass" 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conf-pass">Confirm New Password</Label>
              <Input 
                id="conf-pass" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LayoutShell>
  );
}
