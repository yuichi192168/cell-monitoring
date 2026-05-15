
"use client"

import React, { useState } from 'react';
import { LayoutShell } from '@/components/layout-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Plus, Filter, MoreHorizontal, Edit, Trash2, ShieldAlert } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('Member');
  const db = useFirestore();

  const membersQuery = useMemoFirebase(() => {
    return query(collection(db, 'users'), orderBy('name', 'asc'));
  }, [db]);

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

  return (
    <LayoutShell>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-bold tracking-tight">Member Registry</h1>
            <p className="text-muted-foreground">Search, filter, and manage all system member records.</p>
          </div>
          {currentUser?.role === 'Admin' && (
            <Button className="gap-2">
              <Plus className="size-4" />
              Add New Member
            </Button>
          )}
        </div>

        <Card className="glass-card">
          <CardHeader className="pb-0">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Search members by name or email..." 
                  className="pl-9 h-11"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2 h-11 px-6">
                <Filter className="size-4" />
                Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="rounded-md border border-border">
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
                            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs overflow-hidden">
                              {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                              ) : (
                                member.name?.substring(0, 2)
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-xs text-muted-foreground">{member.email}</div>
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
                        <TableCell className="text-muted-foreground text-sm">
                          {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {currentUser?.role === 'Admin' && (
                                <>
                                  <DropdownMenuItem 
                                    className="gap-2"
                                    onClick={() => {
                                      setEditingMember(member);
                                      setNewRole(member.role);
                                    }}
                                  >
                                    <ShieldAlert className="size-4" />
                                    Change Role
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-2">
                                    <Edit className="size-4" />
                                    Edit Record
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="gap-2 text-destructive"
                                    onClick={() => handleDeleteMember(member.id)}
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
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                        No members found matching your search criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Security Clearance</DialogTitle>
            <DialogDescription>
              Modify the role for {editingMember?.name}. This impacts system-wide permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={(value: UserRole) => setNewRole(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Member">Member</SelectItem>
                <SelectItem value="Leader">Leader</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button>
            <Button onClick={handleUpdateRole}>Confirm Change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LayoutShell>
  );
}
