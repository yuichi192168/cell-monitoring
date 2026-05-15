"use client"

import React, { useState } from 'react';
import { LayoutShell } from '@/components/layout-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Plus, Filter, MoreHorizontal, Edit, Trash2, ShieldAlert, Lock, User, Mail, Calendar } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function MemberManagement() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('Member');
  const db = useFirestore();

  const membersQuery = useMemoFirebase(() => {
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Leader')) return null;
    return query(collection(db, 'users'), orderBy('name', 'asc'));
  }, [db, currentUser]);

  const { data: members, loading } = useCollection(membersQuery);

  const filteredMembers = members.filter((m: any) => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateRole = () => {
    if (!editingMember) return;
    
    const userRef = doc(db, 'users', editingMember.id);
    updateDoc(userRef, { role: newRole })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: { role: newRole }
        });
        errorEmitter.emit('permission-error', permissionError);
      });
    
    setEditingMember(null);
  };

  const handleDeleteMember = (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member? This action is irreversible.")) return;
    
    const userRef = doc(db, 'users', memberId);
    deleteDoc(userRef)
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'delete'
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (currentUser?.role === 'Member') {
    return (
      <LayoutShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-6 animate-in fade-in duration-500">
          <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center shadow-inner">
            <Lock className="size-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-headline font-bold">Access Restricted</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              You do not have the required security clearance to view the strategic member registry.
            </p>
          </div>
          <Button onClick={() => router.push('/dashboard')} size="lg" className="w-full max-w-xs">Return to Dashboard</Button>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-headline font-bold tracking-tight">Member Registry</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage tactical member records.</p>
          </div>
          {currentUser?.role === 'Admin' && (
            <Button className="gap-2 w-full sm:w-auto h-12 sm:h-10">
              <Plus className="size-4" />
              Add New Member
            </Button>
          )}
        </div>

        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-4 sm:pb-0 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Search members..." 
                  className="pl-9 h-11 sm:h-11"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2 h-11 px-6 w-full sm:w-auto">
                <Filter className="size-4" />
                Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 px-0 sm:px-6">
            {/* Desktop Table View */}
            <div className="hidden sm:block rounded-md border border-border">
              <Table>
                <TableHeader className="bg-secondary/30">
                  <TableRow>
                    <TableHead className="w-[250px]">Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        Syncing registry data...
                      </TableCell>
                    </TableRow>
                  ) : filteredMembers.length > 0 ? (
                    filteredMembers.map((member: any) => (
                      <TableRow key={member.id} className="group transition-colors hover:bg-secondary/20">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center border border-border">
                              <User className="size-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{member.name}</div>
                              <div className="text-[10px] text-muted-foreground">{member.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal text-[10px]">{member.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={member.status === 'Active' ? 'default' : 'secondary'}
                            className="font-medium text-[10px]"
                          >
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <MemberActions 
                            member={member} 
                            currentUser={currentUser} 
                            onEditRole={(m) => {
                              setEditingMember(m);
                              setNewRole(m.role);
                            }}
                            onDelete={(id) => handleDeleteMember(id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden px-4 space-y-4">
              {loading ? (
                <div className="py-12 text-center text-muted-foreground">Syncing data...</div>
              ) : filteredMembers.length > 0 ? (
                filteredMembers.map((member: any) => (
                  <div key={member.id} className="p-4 rounded-xl border border-border bg-secondary/10 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center border border-border">
                          <User className="size-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-bold">{member.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="size-3" />
                            {member.email}
                          </div>
                        </div>
                      </div>
                      <MemberActions 
                        member={member} 
                        currentUser={currentUser} 
                        onEditRole={(m) => {
                          setEditingMember(m);
                          setNewRole(m.role);
                        }}
                        onDelete={(id) => handleDeleteMember(id)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Clearance</p>
                        <Badge variant="outline" className="text-[10px] py-0 px-2">{member.role}</Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Status</p>
                        <Badge 
                          variant={member.status === 'Active' ? 'default' : 'secondary'}
                          className="text-[10px] py-0 px-2"
                        >
                          {member.status}
                        </Badge>
                      </div>
                      <div className="col-span-2 space-y-1 pt-1">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="size-3" />
                          Joined {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-muted-foreground italic">No members found.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Update Security Clearance</DialogTitle>
            <DialogDescription>
              Modify permissions for {editingMember?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Select value={newRole} onValueChange={(value: UserRole) => setNewRole(value)}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Member">Member</SelectItem>
                <SelectItem value="Leader">Leader</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="h-12 sm:h-10" onClick={() => setEditingMember(null)}>Cancel</Button>
            <Button className="h-12 sm:h-10" onClick={handleUpdateRole}>Confirm Change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LayoutShell>
  );
}

function MemberActions({ member, currentUser, onEditRole, onDelete }: any) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {currentUser?.role === 'Admin' && (
          <>
            <DropdownMenuItem 
              className="gap-2 py-3 sm:py-2"
              onClick={() => onEditRole(member)}
            >
              <ShieldAlert className="size-4" />
              Change Role
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 py-3 sm:py-2">
              <Edit className="size-4" />
              Edit Record
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="gap-2 text-destructive py-3 sm:py-2"
              onClick={() => onDelete(member.id)}
            >
              <Trash2 className="size-4" />
              Delete Member
            </DropdownMenuItem>
          </>
        )}
        {currentUser?.role !== 'Admin' && (
          <DropdownMenuItem disabled className="text-xs italic text-muted-foreground">
            Insufficient Clearance
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
