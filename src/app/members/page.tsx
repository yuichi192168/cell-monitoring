"use client"

import React, { useState } from 'react';
import { LayoutShell } from '@/components/layout-shell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Plus, Filter, MoreHorizontal, Edit, Trash2, Lock, User, CheckCircle2, ClipboardList, StickyNote, ShieldCheck } from 'lucide-react';
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
    status: 'Active' as MemberStatus,
    role: 'Member' as UserRole,
    ladderOfSuccess: [] as string[],
    targetToDo: '',
    remarks: ''
  });

  const db = useFirestore();

  const membersQuery = useMemoFirebase(() => {
    if (!currentUser || !currentUser.id || !currentUser.role) return null;
    
    const usersRef = collection(db, 'users');
    
    if (currentUser.role === 'Admin') {
      return query(usersRef, orderBy('name', 'asc'));
    }
    
    if (currentUser.role === 'Leader') {
      return query(usersRef, where('assignedLeaderId', '==', currentUser.id));
    }
    
    return null;
  }, [db, currentUser?.id, currentUser?.role]);

  const { data: members, loading } = useCollection(membersQuery);

  const filteredMembers = (members || [])
    .filter((m: any) => m.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));

  const openEditModal = (member: any) => {
    setEditingMember(member);
    setFormData({
      name: member.name || '',
      status: member.status || 'Active',
      role: member.role || 'Member',
      ladderOfSuccess: member.ladderOfSuccess || [],
      targetToDo: (member.targetToDo || []).join(', '),
      remarks: member.remarks || ''
    });
  };

  const handleUpdateMember = () => {
    if (!editingMember) return;
    
    const targets = formData.targetToDo.split(',').map(t => t.trim()).filter(Boolean);
    const updatePayload = {
      ...formData,
      targetToDo: targets
    };

    const userRef = doc(db, 'users', editingMember.id);
    updateDoc(userRef, updatePayload)
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updatePayload
        });
        errorEmitter.emit('permission-error', permissionError);
      });
    
    setEditingMember(null);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const targets = formData.targetToDo.split(',').map(t => t.trim()).filter(Boolean);
    const newUser = {
      ...formData,
      targetToDo: targets,
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
      status: 'Active',
      role: 'Member',
      ladderOfSuccess: [],
      targetToDo: '',
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
            <p className="text-sm text-muted-foreground">Manage your team and track their growth journey.</p>
          </div>
          <Button className="gap-2 h-11 w-full sm:w-auto" onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
            <Plus className="size-4" />
            Add Member
          </Button>
        </div>

        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-4 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name..." 
                  className="pl-9 h-11"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2 h-11 shrink-0">
                <Filter className="size-4" />
                Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {/* Desktop Table */}
            <div className="hidden sm:block border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-secondary/30">
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Growth</TableHead>
                    <TableHead>Notes</TableHead>
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
                            <div className="font-medium text-sm">{member.name}</div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className="text-[10px]">{member.status || 'Active'}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {SOL_STAGES.map(stage => (
                              <Badge key={stage} variant={member.ladderOfSuccess?.includes(stage) ? 'default' : 'outline'} className="text-[9px] px-1.5 py-0 border-none">
                                {stage[0]}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground text-[10px]">
                          {member.remarks || '-'}
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
                    <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">No members found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden px-4 space-y-4 pb-6">
              {loading ? (
                <div className="py-20 text-center text-muted-foreground italic">Loading members...</div>
              ) : filteredMembers.length > 0 ? (
                filteredMembers.map((member: any) => (
                  <div key={member.id} className="p-5 rounded-2xl border bg-secondary/10 space-y-5 transition-all active:scale-[0.98]">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center border shrink-0"><User className="size-5 text-muted-foreground" /></div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">{member.name}</div>
                          <Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className="text-[8px] h-4 mt-1">{member.status || 'Active'}</Badge>
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
                    
                    <div className="space-y-4 pt-4 border-t border-border/40">
                      <div className="space-y-2">
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1.5">
                          <CheckCircle2 className="size-3" /> Growth Journey
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {SOL_STAGES.map(s => (
                            <Badge key={s} variant={member.ladderOfSuccess?.includes(s) ? 'default' : 'outline'} className="text-[8px] h-5 px-2">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {member.remarks && (
                        <div className="space-y-2">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1.5">
                            <StickyNote className="size-3" /> Progress Notes
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed break-words line-clamp-3 italic">
                            {member.remarks}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-muted-foreground italic">No members found.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-lg w-[95%] rounded-2xl p-0 overflow-hidden">
          <div className="p-6 max-h-[85vh] overflow-y-auto">
            <DialogHeader className="mb-4">
              <DialogTitle>Add Member</DialogTitle>
              <DialogDescription>Enroll a new person and track their spiritual growth.</DialogDescription>
            </DialogHeader>
            <MemberForm formData={formData} setFormData={setFormData} toggleSOL={toggleSOL} isAdmin={currentUser?.role === 'Admin'} />
          </div>
          <DialogFooter className="p-6 pt-2 bg-secondary/10 border-t flex flex-row gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleAddMember}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="sm:max-w-lg w-[95%] rounded-2xl p-0 overflow-hidden">
          <div className="p-6 max-h-[85vh] overflow-y-auto">
            <DialogHeader className="mb-4">
              <DialogTitle>Edit Member Journey</DialogTitle>
              <DialogDescription>Update the progress and targets for {editingMember?.name}.</DialogDescription>
            </DialogHeader>
            <MemberForm formData={formData} setFormData={setFormData} toggleSOL={toggleSOL} isAdmin={currentUser?.role === 'Admin'} />
          </div>
          <DialogFooter className="p-6 pt-2 bg-secondary/10 border-t flex flex-row gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setEditingMember(null)}>Cancel</Button>
            <Button className="flex-1" onClick={handleUpdateMember}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LayoutShell>
  );
}

function MemberForm({ formData, setFormData, toggleSOL, isAdmin }: any) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Full Name</Label>
        <Input 
          value={formData.name} 
          onChange={e => setFormData({ ...formData, name: e.target.value })} 
          placeholder="Enter member's name" 
          className="h-12 bg-secondary/20 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Status</Label>
          <Select value={formData.status} onValueChange={(v: MemberStatus) => setFormData({ ...formData, status: v })}>
            <SelectTrigger className="h-12 bg-secondary/20 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">System Role</Label>
          <Select value={formData.role} onValueChange={(v: UserRole) => setFormData({ ...formData, role: v })} disabled={!isAdmin}>
            <SelectTrigger className="h-12 bg-secondary/20 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Member">Cell Member</SelectItem>
              <SelectItem value="Leader">Cell Leader</SelectItem>
              <SelectItem value="Admin">Primary Leader</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 p-5 rounded-2xl bg-secondary/20 border border-border/50">
        <Label className="flex items-center gap-2 text-accent uppercase tracking-widest text-[10px] font-black">
          <CheckCircle2 className="size-4" /> Ladder of Success
        </Label>
        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
          {SOL_STAGES.map(stage => (
            <div key={stage} className="flex items-center space-x-3 group cursor-pointer" onClick={() => toggleSOL(stage)}>
              <Checkbox 
                id={stage} 
                checked={formData.ladderOfSuccess.includes(stage)} 
                onCheckedChange={() => toggleSOL(stage)} 
                className="rounded-md h-5 w-5 border-border/60"
              />
              <Label htmlFor={stage} className="text-xs font-semibold cursor-pointer select-none group-hover:text-foreground transition-colors">{stage}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-accent uppercase tracking-widest text-[10px] font-black">
          <ClipboardList className="size-4" /> Active Goals
        </Label>
        <Input 
          value={formData.targetToDo} 
          onChange={e => setFormData({ ...formData, targetToDo: e.target.value })}
          placeholder="e.g. Finish Module 1, Invite a friend" 
          className="h-12 bg-secondary/20 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-accent uppercase tracking-widest text-[10px] font-black">
          <StickyNote className="size-4" /> Progress Notes
        </Label>
        <Textarea 
          value={formData.remarks} 
          onChange={e => setFormData({ ...formData, remarks: e.target.value })} 
          placeholder="Add follow-up actions or growth observations..." 
          className="min-h-[120px] bg-secondary/20 rounded-xl resize-none p-4"
        />
      </div>
    </div>
  );
}

function MemberActions({ member, currentUser, onEdit, onDelete, onChangeRole }: any) {
  const isAdmin = currentUser?.role === 'Admin';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-secondary/50">
          <MoreHorizontal className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl border shadow-xl">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-black p-3 pb-2">Member Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={onEdit} className="gap-3 p-3 rounded-lg cursor-pointer">
          <Edit className="size-4" /> 
          <span className="font-semibold">Edit Journey</span>
        </DropdownMenuItem>
        
        {isAdmin && (
          <>
            <DropdownMenuSeparator className="mx-2" />
            <DropdownMenuLabel className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60 font-black p-3 pb-1">System Roles</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onChangeRole(member.id, 'Member')} className="gap-3 p-3 rounded-lg cursor-pointer">
              <User className="size-4" /> Cell Member
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeRole(member.id, 'Leader')} className="gap-3 p-3 rounded-lg cursor-pointer text-accent">
              <ShieldCheck className="size-4" /> Cell Leader
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mx-2" />
            <DropdownMenuItem onClick={() => onDelete(member.id)} className="gap-3 p-3 rounded-lg cursor-pointer text-destructive focus:text-destructive">
              <Trash2 className="size-4" /> 
              <span className="font-semibold">Delete Record</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
