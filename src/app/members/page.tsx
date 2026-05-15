
"use client"

import React, { useState } from 'react';
import { LayoutShell } from '@/components/layout-shell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Plus, Filter, MoreHorizontal, Edit, Trash2, Lock, User, Mail, CheckCircle2, ClipboardList, StickyNote, ShieldCheck } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc, where, addDoc } from 'firebase/firestore';
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
import { UserRole, MemberStatus, SOL_STAGES } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

export default function MemberRegistry() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    status: 'Active' as MemberStatus,
    role: 'Member' as UserRole,
    ladderOfSuccess: [] as string[],
    targetToDo: [] as string[],
    remarks: ''
  });

  const db = useFirestore();

  const membersQuery = useMemoFirebase(() => {
    if (!currentUser || !currentUser.role) return null;
    if (currentUser.role === 'Admin') return query(collection(db, 'users'), orderBy('name', 'asc'));
    if (currentUser.role === 'Leader') return query(collection(db, 'users'), where('assignedLeaderId', '==', currentUser.id), orderBy('name', 'asc'));
    return null;
  }, [db, currentUser]);

  const { data: members, loading } = useCollection(membersQuery);

  const filteredMembers = (members || []).filter((m: any) => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditModal = (member: any) => {
    setEditingMember(member);
    setFormData({
      name: member.name || '',
      email: member.email || '',
      status: member.status || 'Active',
      role: member.role || 'Member',
      ladderOfSuccess: member.ladderOfSuccess || [],
      targetToDo: member.targetToDo || [],
      remarks: member.remarks || ''
    });
  };

  const handleUpdateMember = () => {
    if (!editingMember) return;
    
    const userRef = doc(db, 'users', editingMember.id);
    updateDoc(userRef, { ...formData })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: formData
        });
        errorEmitter.emit('permission-error', permissionError);
      });
    
    setEditingMember(null);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const newUser = {
      ...formData,
      assignedLeaderId: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    const usersRef = collection(db, 'users');
    addDoc(usersRef, newUser)
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: usersRef.path,
          operation: 'create',
          requestResourceData: newUser
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    setIsAddDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      status: 'Active',
      role: 'Member',
      ladderOfSuccess: [],
      targetToDo: [],
      remarks: ''
    });
  };

  const handleDeleteMember = (memberId: string) => {
    if (!confirm("Are you sure you want to remove this person? This action cannot be undone.")) return;
    
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

  const handleChangeRole = (memberId: string, newRole: UserRole) => {
    const userRef = doc(db, 'users', memberId);
    updateDoc(userRef, { role: newRole })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: { role: newRole }
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const toggleSOL = (stage: string) => {
    setFormData(prev => ({
      ...prev,
      ladderOfSuccess: prev.ladderOfSuccess.includes(stage)
        ? prev.ladderOfSuccess.filter(s => s !== stage)
        : [...prev.ladderOfSuccess, stage]
    }));
  };

  const handleTargetChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      targetToDo: value.split(',').map(t => t.trim()).filter(t => t !== '')
    }));
  };

  const getRoleDisplay = (role: string) => {
    if (role === 'Admin') return 'Primary Leader';
    if (role === 'Leader') return 'Cell Leader';
    return 'Cell Member';
  };

  if (currentUser && currentUser.role === 'Member') {
    return (
      <LayoutShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center shadow-inner">
            <Lock className="size-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-headline font-bold">Access Restricted</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">You do not have the required permissions to view the member list.</p>
          </div>
          <Button onClick={() => router.push('/dashboard')} size="lg">Return to Dashboard</Button>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-headline font-bold">Members</h1>
            <p className="text-sm text-muted-foreground">Manage your community and track their growth journey.</p>
          </div>
          <Button className="gap-2 h-11" onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
            <Plus className="size-4" />
            Add New Member
          </Button>
        </div>

        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name or email..." 
                  className="pl-9 h-11"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2 h-11">
                <Filter className="size-4" />
                Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            <div className="hidden sm:block border rounded-md">
              <Table>
                <TableHeader className="bg-secondary/30">
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Loading members...</TableCell></TableRow>
                  ) : filteredMembers.length > 0 ? (
                    filteredMembers.map((member: any) => (
                      <TableRow key={member.id} className="hover:bg-secondary/10 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center border border-border">
                              <User className="size-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{member.name}</div>
                              <div className="text-[10px] text-muted-foreground">{getRoleDisplay(member.role)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className="text-[10px]">{member.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {SOL_STAGES.map(stage => (
                              <Badge key={stage} variant={member.ladderOfSuccess?.includes(stage) ? 'default' : 'outline'} className="text-[9px] px-1.5 py-0 border-none">
                                {stage[0]}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-[10px]">
                          {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <MemberActions 
                            member={member} 
                            currentUser={currentUser} 
                            onEdit={() => openEditModal(member)} 
                            onDelete={handleDeleteMember}
                            onChangeRole={handleChangeRole}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">No one found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="sm:hidden px-4 space-y-4">
              {filteredMembers.map((member: any) => (
                <div key={member.id} className="p-4 rounded-xl border bg-secondary/10 space-y-4">
                  <div className="flex justify-between">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center border"><User className="size-5 text-muted-foreground" /></div>
                      <div>
                        <div className="font-bold text-sm">{member.name}</div>
                        <div className="text-[10px] text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                    <MemberActions 
                      member={member} 
                      currentUser={currentUser} 
                      onEdit={() => openEditModal(member)} 
                      onDelete={handleDeleteMember}
                      onChangeRole={handleChangeRole}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div className="space-y-1">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Progress</p>
                      <div className="flex gap-1">
                        {SOL_STAGES.map(s => <Badge key={s} variant={member.ladderOfSuccess?.includes(s) ? 'default' : 'outline'} className="text-[8px] h-4">{s}</Badge>)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Status</p>
                      <Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className="text-[9px] h-4">{member.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>Enter details to start tracking their progress.</DialogDescription>
          </DialogHeader>
          <MemberForm formData={formData} setFormData={setFormData} toggleSOL={toggleSOL} handleTargetChange={handleTargetChange} isAdmin={currentUser?.role === 'Admin'} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMember}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Details</DialogTitle>
            <DialogDescription>Update the progress information for {editingMember?.name}.</DialogDescription>
          </DialogHeader>
          <MemberForm formData={formData} setFormData={setFormData} toggleSOL={toggleSOL} handleTargetChange={handleTargetChange} isAdmin={currentUser?.role === 'Admin'} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button>
            <Button onClick={handleUpdateMember}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LayoutShell>
  );
}

function MemberForm({ formData, setFormData, toggleSOL, handleTargetChange, isAdmin }: any) {
  return (
    <div className="space-y-5 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Enter name" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Enter email" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(v: MemberStatus) => setFormData({ ...formData, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="On Leave">On Leave</SelectItem>
              <SelectItem value="Trial">Trial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={formData.role} onValueChange={(v: UserRole) => setFormData({ ...formData, role: v })} disabled={!isAdmin}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Member">Cell Member</SelectItem>
              <SelectItem value="Leader">Cell Leader</SelectItem>
              <SelectItem value="Admin">Primary Leader</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 p-4 rounded-xl bg-secondary/20 border">
        <Label className="flex items-center gap-2"><CheckCircle2 className="size-4 text-accent" /> Growth Progress (SOL)</Label>
        <div className="flex gap-4">
          {SOL_STAGES.map(stage => (
            <div key={stage} className="flex items-center space-x-2">
              <Checkbox id={stage} checked={formData.ladderOfSuccess.includes(stage)} onCheckedChange={() => toggleSOL(stage)} />
              <Label htmlFor={stage} className="text-xs font-medium cursor-pointer">{stage}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2"><ClipboardList className="size-4 text-accent" /> Active Goals (separate with commas)</Label>
        <Input 
          value={formData.targetToDo.join(', ')} 
          onChange={e => handleTargetChange(e.target.value)}
          placeholder="e.g. Finish Module 1, Attend Bible Study" 
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2"><StickyNote className="size-4 text-accent" /> Personal Notes</Label>
        <Textarea 
          value={formData.remarks} 
          onChange={e => setFormData({ ...formData, remarks: e.target.value })} 
          placeholder="Add any helpful notes or follow-up tasks..." 
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
}

function MemberActions({ member, currentUser, onEdit, onDelete, onChangeRole }: any) {
  const isAdmin = currentUser?.role === 'Admin';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={onEdit} className="gap-2"><Edit className="size-4" /> Edit Profile</DropdownMenuItem>
        
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Change Role</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onChangeRole(member.id, 'Member')} className="gap-2">
              <User className="size-4" /> Cell Member
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeRole(member.id, 'Leader')} className="gap-2 text-accent">
              <ShieldCheck className="size-4" /> Cell Leader
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(member.id)} className="gap-2 text-destructive"><Trash2 className="size-4" /> Delete Person</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
