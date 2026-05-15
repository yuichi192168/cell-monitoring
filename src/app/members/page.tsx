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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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
          <Button onClick={() => router.push('/dashboard')} size="lg" className="rounded-2xl h-12 px-8 active:scale-95 transition-all">Return to Dashboard</Button>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="space-y-6 animate-in fade-in duration-500 pb-24 sm:pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-headline font-bold tracking-tight">Members</h1>
            <p className="text-sm text-muted-foreground">Manage your team and track their growth journey.</p>
          </div>
          <Button className="gap-2 h-12 w-full sm:w-auto rounded-2xl font-black shadow-xl shadow-primary/20 active:scale-95 transition-all" onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
            <Plus className="size-5" />
            Add Member
          </Button>
        </div>

        <Card className="glass-card overflow-hidden border-white/5 shadow-2xl">
          <CardHeader className="pb-4 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name..." 
                  className="pl-10 h-12 bg-secondary/20 rounded-2xl border-none focus-visible:ring-1 focus-visible:ring-accent/50 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2 h-12 shrink-0 rounded-2xl font-bold border-white/5 active:scale-95 transition-all">
                <Filter className="size-4" />
                Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {/* Desktop Table */}
            <div className="hidden sm:block border border-white/5 rounded-2xl overflow-hidden">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader className="bg-secondary/30">
                    <TableRow className="hover:bg-transparent border-white/5">
                      <TableHead className="font-bold py-4">Member</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold">Growth</TableHead>
                      <TableHead className="font-bold">Notes</TableHead>
                      <TableHead className="text-right font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground animate-pulse">Loading members...</TableCell></TableRow>
                    ) : filteredMembers.length > 0 ? (
                      filteredMembers.map((member: any) => (
                        <TableRow key={member.id} className="hover:bg-secondary/10 transition-colors border-white/5">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center border border-white/5 shadow-inner">
                                <User className="size-4 text-muted-foreground" />
                              </div>
                              <div className="font-bold text-sm tracking-tight">{member.name}</div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className="text-[10px] font-bold h-5 px-2 rounded-lg">{member.status || 'Active'}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {SOL_STAGES.map(stage => (
                                <Badge key={stage} variant={member.ladderOfSuccess?.includes(stage) ? 'default' : 'outline'} className="text-[9px] px-1.5 py-0 border-none rounded-md">
                                  {stage[0]}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground text-[10px] italic">
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
                      <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic tracking-wide">No members found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden px-4 space-y-4 pb-8">
              {loading ? (
                <div className="py-24 text-center text-muted-foreground italic animate-pulse">Loading members...</div>
              ) : filteredMembers.length > 0 ? (
                filteredMembers.map((member: any) => (
                  <div key={member.id} className="p-5 rounded-[2rem] border border-white/5 bg-secondary/10 space-y-5 transition-all active:scale-[0.98]">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex gap-4 min-w-0">
                        <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center border border-white/5 shrink-0 shadow-lg">
                          <User className="size-6 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <div className="font-black text-base truncate tracking-tight">{member.name}</div>
                          <Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className="text-[9px] h-4.5 mt-1 font-bold px-2 rounded-lg">{member.status || 'Active'}</Badge>
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
                    
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="space-y-2.5">
                        <p className="text-[10px] text-accent uppercase font-black tracking-widest flex items-center gap-2">
                          <CheckCircle2 className="size-3.5" /> Growth Journey
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {SOL_STAGES.map(s => (
                            <Badge key={s} variant={member.ladderOfSuccess?.includes(s) ? 'default' : 'outline'} className="text-[9px] h-6 px-3 rounded-xl border-white/5 font-bold">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {member.remarks && (
                        <div className="space-y-2.5">
                          <p className="text-[10px] text-accent uppercase font-black tracking-widest flex items-center gap-2">
                            <StickyNote className="size-3.5" /> Progress Notes
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed break-words line-clamp-4 italic bg-secondary/20 p-3 rounded-2xl border border-white/5">
                            {member.remarks}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-24 text-center text-muted-foreground italic tracking-wide">No members found.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-lg w-[95%] rounded-[2.5rem] p-0 overflow-hidden border-white/10 shadow-2xl">
          <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black">Add Member</DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground">Enroll a new person and track their spiritual growth.</DialogDescription>
            </DialogHeader>
            <MemberForm formData={formData} setFormData={setFormData} toggleSOL={toggleSOL} isAdmin={currentUser?.role === 'Admin'} />
          </div>
          <DialogFooter className="p-6 sm:p-8 pt-2 bg-secondary/10 border-t border-white/5 flex flex-row gap-3">
            <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-white/5 active:scale-95 transition-all" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button className="flex-1 h-14 rounded-2xl font-black shadow-xl shadow-primary/20 active:scale-95 transition-all" onClick={handleAddMember}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="sm:max-w-lg w-[95%] rounded-[2.5rem] p-0 overflow-hidden border-white/10 shadow-2xl">
          <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black">Edit Member Journey</DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground">Update the progress and targets for {editingMember?.name}.</DialogDescription>
            </DialogHeader>
            <MemberForm formData={formData} setFormData={setFormData} toggleSOL={toggleSOL} isAdmin={currentUser?.role === 'Admin'} />
          </div>
          <DialogFooter className="p-6 sm:p-8 pt-2 bg-secondary/10 border-t border-white/5 flex flex-row gap-3">
            <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-white/5 active:scale-95 transition-all" onClick={() => setEditingMember(null)}>Cancel</Button>
            <Button className="flex-1 h-14 rounded-2xl font-black shadow-xl shadow-primary/20 active:scale-95 transition-all" onClick={handleUpdateMember}>Save Changes</Button>
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
        <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground ml-1">Full Name</Label>
        <Input 
          value={formData.name} 
          onChange={e => setFormData({ ...formData, name: e.target.value })} 
          placeholder="Enter member's name" 
          className="h-14 bg-secondary/20 rounded-2xl border-none focus-visible:ring-1 focus-visible:ring-accent/50 transition-all text-base"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground ml-1">Status</Label>
          <Select value={formData.status} onValueChange={(v: MemberStatus) => setFormData({ ...formData, status: v })}>
            <SelectTrigger className="h-14 bg-secondary/20 rounded-2xl border-none text-base"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl border-white/10">
              <SelectItem value="Active" className="rounded-xl">Active</SelectItem>
              <SelectItem value="Inactive" className="rounded-xl">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground ml-1">System Role</Label>
          <Select value={formData.role} onValueChange={(v: UserRole) => setFormData({ ...formData, role: v })} disabled={!isAdmin}>
            <SelectTrigger className="h-14 bg-secondary/20 rounded-2xl border-none text-base"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl border-white/10">
              <SelectItem value="Member" className="rounded-xl">Cell Member</SelectItem>
              <SelectItem value="Leader" className="rounded-xl">Cell Leader</SelectItem>
              <SelectItem value="Admin" className="rounded-xl">Primary Leader</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 p-5 rounded-[2rem] bg-secondary/20 border border-white/5 backdrop-blur-sm">
        <Label className="flex items-center gap-2 text-accent uppercase tracking-widest text-[10px] font-black ml-1">
          <CheckCircle2 className="size-4" /> Ladder of Success
        </Label>
        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
          {SOL_STAGES.map(stage => (
            <div 
              key={stage} 
              className="flex items-center space-x-3 group cursor-pointer p-2 hover:bg-white/5 rounded-xl transition-all" 
              onClick={() => toggleSOL(stage)}
            >
              <Checkbox 
                id={stage} 
                checked={formData.ladderOfSuccess.includes(stage)} 
                onCheckedChange={() => toggleSOL(stage)} 
                className="rounded-lg h-6 w-6 border-muted-foreground/40 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                onClick={(e) => e.stopPropagation()}
              />
              <Label htmlFor={stage} className="text-sm font-bold cursor-pointer select-none group-hover:text-foreground transition-colors">{stage}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-accent uppercase tracking-widest text-[10px] font-black ml-1">
          <ClipboardList className="size-4" /> Active Goals
        </Label>
        <Input 
          value={formData.targetToDo} 
          onChange={e => setFormData({ ...formData, targetToDo: e.target.value })}
          placeholder="e.g. Finish Module 1, Invite a friend" 
          className="h-14 bg-secondary/20 rounded-2xl border-none focus-visible:ring-1 focus-visible:ring-accent/50 transition-all text-base"
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-accent uppercase tracking-widest text-[10px] font-black ml-1">
          <StickyNote className="size-4" /> Progress Notes
        </Label>
        <Textarea 
          value={formData.remarks} 
          onChange={e => setFormData({ ...formData, remarks: e.target.value })} 
          placeholder="Add follow-up actions or growth observations..." 
          className="min-h-[140px] bg-secondary/20 rounded-2xl border-none resize-none p-4 focus-visible:ring-1 focus-visible:ring-accent/50 transition-all text-base"
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
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-secondary/50 active:scale-90 transition-all">
          <MoreHorizontal className="size-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-[1.5rem] border border-white/10 shadow-2xl p-2">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-black p-3 pb-2">Member Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={onEdit} className="gap-3 p-3.5 rounded-xl cursor-pointer hover:bg-secondary transition-all">
          <Edit className="size-5" /> 
          <span className="font-bold">Edit Journey</span>
        </DropdownMenuItem>
        
        {isAdmin && (
          <>
            <DropdownMenuSeparator className="mx-2 opacity-50" />
            <DropdownMenuLabel className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60 font-black p-3 pb-1">System Roles</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onChangeRole(member.id, 'Member')} className="gap-3 p-3.5 rounded-xl cursor-pointer hover:bg-secondary transition-all">
              <User className="size-5" /> Cell Member
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeRole(member.id, 'Leader')} className="gap-3 p-3.5 rounded-xl cursor-pointer text-accent hover:bg-secondary transition-all">
              <ShieldCheck className="size-5" /> Cell Leader
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mx-2 opacity-50" />
            <DropdownMenuItem onClick={() => onDelete(member.id)} className="gap-3 p-3.5 rounded-xl cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10 transition-all">
              <Trash2 className="size-5" /> 
              <span className="font-bold">Delete Record</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
