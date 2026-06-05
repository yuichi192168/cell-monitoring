
"use client"

import React, { useState, useCallback } from 'react';
import { LayoutShell } from '@/components/layout-shell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Plus, MoreHorizontal, Edit, Trash2, Lock, User, CheckCircle2, ClipboardList, StickyNote, ShieldCheck, Check, Fingerprint, Eye } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, doc, updateDoc, deleteDoc, where, addDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserRole, MemberStatus, SOL_STAGES } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { recordActivityLog } from '@/firebase/activity-logs';

export default function MemberRegistry() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    status: 'Active' as MemberStatus,
    role: 'Member' as UserRole,
    ladderOfSuccess: [] as string[],
    targetToDo: '',
    remarks: '',
    characteristics: ''
  });

  const db = useFirestore();

  const membersQuery = useMemoFirebase(() => {
    if (!currentUser || !currentUser.id || !currentUser.role) return null;
    const usersRef = collection(db, 'users');
    if (currentUser.role === 'Admin') return query(usersRef);
    if (currentUser.role === 'Leader') return query(usersRef, where('assignedLeaderId', '==', currentUser.id));
    return null;
  }, [db, currentUser?.id, currentUser?.role]);

  const { data: membersRaw, loading } = useCollection(membersQuery);

  const filteredMembers = React.useMemo(() => {
    return (membersRaw || [])
      .filter((m: any) => m.role === 'Member' && m.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [membersRaw, searchTerm]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      status: 'Active',
      role: 'Member',
      ladderOfSuccess: [],
      targetToDo: '',
      remarks: '',
      characteristics: ''
    });
    setEditingMember(null);
    setIsViewOnly(false);
  }, []);

  const openCard = (member: any, viewOnly: boolean = true) => {
    setFormData({
      name: member.name || '',
      status: member.status || 'Active',
      role: member.role || 'Member',
      ladderOfSuccess: member.ladderOfSuccess || [],
      targetToDo: (member.targetToDo || []).join(', '),
      remarks: member.remarks || '',
      characteristics: member.characteristics || ''
    });
    setIsViewOnly(viewOnly);
    setEditingMember(member);
  };

  const unlockUI = () => {
    setTimeout(() => {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
    }, 300);
  };

  const handleUpdateMember = () => {
    if (!editingMember || !currentUser) return;
    setIsSubmitting(true);
    
    const targets = formData.targetToDo.split(',').map(t => t.trim()).filter(Boolean);
    const updatePayload = {
      ...formData,
      targetToDo: targets
    };

    const userRef = doc(db, 'users', editingMember.id);
    
    updateDoc(userRef, updatePayload)
      .then(() => {
        toast({ title: "Member Updated", description: `${formData.name}'s profile has been updated.` });
        recordActivityLog(db, {
          actorId: currentUser.id,
          actorName: currentUser.name,
          action: 'update',
          targetId: editingMember.id,
          targetName: formData.name,
          details: `Updated profile for ${formData.name}`
        });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updatePayload
        }));
      })
      .finally(() => {
        setIsSubmitting(false);
        setEditingMember(null);
        resetForm();
        unlockUI();
      });
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);

    const targets = formData.targetToDo.split(',').map(t => t.trim()).filter(Boolean);
    const newUser = {
      ...formData,
      targetToDo: targets,
      assignedLeaderId: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    const usersRef = collection(db, 'users');
    addDoc(usersRef, newUser)
      .then((docRef) => {
        toast({ title: "Member Added", description: `${formData.name} has been added.` });
        recordActivityLog(db, {
          actorId: currentUser.id,
          actorName: currentUser.name,
          action: 'create',
          targetId: docRef.id,
          targetName: formData.name,
          details: `Added new member: ${formData.name}`
        });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: usersRef.path,
          operation: 'create',
          requestResourceData: newUser
        }));
      })
      .finally(() => {
        setIsSubmitting(false);
        setIsAddDialogOpen(false);
        resetForm();
        unlockUI();
      });
  };

  const confirmDelete = () => {
    if (!memberToDelete || !currentUser) return;
    setIsSubmitting(true);
    
    const userRef = doc(db, 'users', memberToDelete.id);
    deleteDoc(userRef)
      .then(() => {
        toast({ title: "Member Deleted", description: "The record has been removed." });
        recordActivityLog(db, {
          actorId: currentUser.id,
          actorName: currentUser.name,
          action: 'delete',
          targetId: memberToDelete.id,
          targetName: memberToDelete.name,
          details: `Deleted member: ${memberToDelete.name}`
        });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'delete' }));
      })
      .finally(() => {
        setIsSubmitting(false);
        setMemberToDelete(null);
        unlockUI();
      });
  };

  const handleChangeRole = (memberId: string, newRole: UserRole) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', memberId);
    updateDoc(userRef, { role: newRole })
      .then(() => {
        toast({ title: "Role Updated", description: `Changed to ${newRole}.` });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: { role: newRole }
        }));
      });
  };

  const toggleSOL = (stage: string) => {
    if (isViewOnly) return;
    setFormData(prev => ({
      ...prev,
      ladderOfSuccess: prev.ladderOfSuccess.includes(stage)
        ? prev.ladderOfSuccess.filter(s => s !== stage)
        : [...prev.ladderOfSuccess, stage]
    }));
  };

  const handleNotesKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isViewOnly) return;
    if (e.key === 'Enter') {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      const newValue = value.substring(0, start) + "\n• " + value.substring(end);
      setFormData(prev => ({ ...prev, remarks: newValue }));
      e.preventDefault();
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 3;
      }, 0);
    }
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
            <p className="text-muted-foreground max-w-sm mx-auto">You do not have required permissions.</p>
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
            <p className="text-sm text-muted-foreground">Manage your team growth.</p>
          </div>
          <Button 
            className="gap-2 h-14 w-full sm:w-auto rounded-2xl font-black shadow-xl shadow-primary/20 active:scale-95 transition-all" 
            onClick={() => { resetForm(); setIsAddDialogOpen(true); }}
            disabled={isSubmitting}
          >
            <Plus className="size-5" />
            Add Member
          </Button>
        </div>

        <Card className="glass-card overflow-hidden border-white/5 shadow-2xl rounded-[1.5rem] sm:rounded-[2rem]">
          <CardHeader className="pb-4 px-4 sm:px-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input 
                  placeholder="Search by name..." 
                  className="pl-12 h-14 bg-secondary/20 rounded-2xl border-none focus-visible:ring-1 focus-visible:ring-accent/50 transition-all text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 sm:px-8">
            <div className="hidden sm:block">
              <ScrollArea className="w-full">
                <div className="min-w-[800px] w-full pb-4">
                  <Table>
                    <TableHeader className="bg-secondary/30">
                      <TableRow className="hover:bg-transparent border-white/5">
                        <TableHead className="font-bold py-5 pl-8">Member</TableHead>
                        <TableHead className="font-bold">Status</TableHead>
                        <TableHead className="font-bold">Growth</TableHead>
                        <TableHead className="font-bold">Notes</TableHead>
                        <TableHead className="text-right font-bold pr-8">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground animate-pulse">Loading members...</TableCell></TableRow>
                      ) : filteredMembers.length > 0 ? (
                        filteredMembers.map((member: any) => (
                          <TableRow key={member.id} className="hover:bg-secondary/10 transition-colors border-white/5 cursor-pointer" onClick={() => openCard(member, true)}>
                            <TableCell className="pl-8">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center border border-white/5 shadow-inner">
                                  <User className="size-5 text-muted-foreground" />
                                </div>
                                <div className="font-bold text-sm tracking-tight">{member.name}</div>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className="text-[10px] font-bold h-5 px-2 rounded-lg">{member.status || 'Active'}</Badge></TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {SOL_STAGES.map(stage => (
                                  <Badge key={stage} variant={member.ladderOfSuccess?.includes(stage) ? 'default' : 'outline'} className="text-[9px] px-2 py-0.5 border-none rounded-md font-bold">
                                    {stage[0]}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-muted-foreground text-[11px] font-medium italic">
                              {member.remarks || '-'}
                            </TableCell>
                            <TableCell className="text-right pr-8" onClick={(e) => e.stopPropagation()}>
                              <MemberActions 
                                member={member} 
                                currentUser={currentUser} 
                                onEdit={() => openCard(member, false)} 
                                onOpen={() => openCard(member, true)}
                                onDelete={() => setMemberToDelete(member)}
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
                </div>
                <ScrollBar orientation="horizontal" className="h-2 bg-secondary/20" />
              </ScrollArea>
            </div>

            <div className="sm:hidden px-4 space-y-4 pb-8">
              {loading ? (
                <div className="py-24 text-center text-muted-foreground italic animate-pulse">Loading members...</div>
              ) : filteredMembers.length > 0 ? (
                filteredMembers.map((member: any) => (
                  <div key={member.id} onClick={() => openCard(member, true)} className="p-6 rounded-[2.25rem] border border-white/5 bg-secondary/10 space-y-5 transition-all active:scale-95">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex gap-4 min-w-0">
                        <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center border border-white/5 shrink-0 shadow-lg">
                          <User className="size-7 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 pt-1">
                          <div className="font-black text-lg truncate tracking-tight leading-tight">{member.name}</div>
                          <Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className="text-[10px] h-5 mt-1.5 font-bold px-2.5 rounded-lg">{member.status || 'Active'}</Badge>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <MemberActions 
                          member={member} 
                          currentUser={currentUser} 
                          onEdit={() => openCard(member, false)} 
                          onOpen={() => openCard(member, true)}
                          onDelete={() => setMemberToDelete(member)}
                          onChangeRole={handleChangeRole}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-5 pt-5 border-t border-white/5">
                      <div className="space-y-3">
                        <p className="text-[10px] text-accent uppercase font-black tracking-widest flex items-center gap-2">
                          <CheckCircle2 className="size-4" /> Growth Journey
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {SOL_STAGES.map(s => (
                            <Badge key={s} variant={member.ladderOfSuccess?.includes(s) ? 'default' : 'secondary'} className="text-[10px] h-7 px-3.5 rounded-xl border-white/5 font-black uppercase tracking-tighter">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
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

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsAddDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg w-[95%] rounded-[2.5rem] p-0 overflow-hidden border-white/10 shadow-2xl">
          <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black">Add Member</DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground">Enroll a new person.</DialogDescription>
            </DialogHeader>
            <MemberForm formData={formData} setFormData={setFormData} toggleSOL={toggleSOL} handleNotesKeyDown={handleNotesKeyDown} isAdmin={currentUser?.role === 'Admin'} isViewOnly={false} />
          </div>
          <DialogFooter className="p-6 sm:p-8 pt-2 bg-secondary/10 border-t border-white/5 flex flex-row gap-3">
            <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-white/5 active:scale-95 transition-all" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button className="flex-1 h-14 rounded-2xl font-black shadow-xl shadow-primary/20 active:scale-95 transition-all" onClick={handleAddMember} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingMember} onOpenChange={(open) => { if (!open) { setEditingMember(null); resetForm(); unlockUI(); } }}>
        <DialogContent className="sm:max-w-lg w-[95%] rounded-[2.5rem] p-0 overflow-hidden border-white/10 shadow-2xl">
          <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black">{isViewOnly ? 'Member View' : 'Member Card'}</DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground">
                {isViewOnly ? 'Viewing profile history.' : 'Detailed growth view.'}
              </DialogDescription>
            </DialogHeader>
            <MemberForm formData={formData} setFormData={setFormData} toggleSOL={toggleSOL} handleNotesKeyDown={handleNotesKeyDown} isAdmin={currentUser?.role === 'Admin'} isViewOnly={isViewOnly} />
          </div>
          <DialogFooter className="p-6 sm:p-8 pt-2 bg-secondary/10 border-t border-white/5 flex flex-row gap-3">
            <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-white/5 active:scale-95 transition-all" onClick={() => setEditingMember(null)}>Close</Button>
            {!isViewOnly && (
              <Button className="flex-1 h-14 rounded-2xl font-black shadow-xl shadow-primary/20 active:scale-95 transition-all" onClick={handleUpdateMember} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => { if(!open) { setMemberToDelete(null); unlockUI(); } }}>
        <AlertDialogContent className="rounded-[2rem] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">Delete Member?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium">
              Are you sure you want to remove {memberToDelete?.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl border-white/5 h-12 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground h-12 font-black" disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LayoutShell>
  );
}

function MemberForm({ formData, setFormData, toggleSOL, handleNotesKeyDown, isAdmin, isViewOnly }: any) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Full Name</Label>
        <Input 
          readOnly={isViewOnly}
          value={formData.name} 
          onChange={e => setFormData({ ...formData, name: e.target.value })} 
          placeholder="Name" 
          className="h-14 bg-secondary/20 rounded-2xl border-none focus-visible:ring-1 focus-visible:ring-accent/50 text-base font-bold"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Status</Label>
          <select disabled={isViewOnly} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as MemberStatus })} className="h-14 bg-secondary/20 rounded-2xl border-none text-base font-bold px-4 w-full appearance-none">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-accent uppercase tracking-widest text-[10px] font-black">
          <Fingerprint className="size-4" /> Characteristics
        </Label>
        <Textarea 
          readOnly={isViewOnly}
          value={formData.characteristics} 
          onChange={e => setFormData({ ...formData, characteristics: e.target.value })} 
          placeholder="Detailed traits, introversion/extroversion, spiritual history, etc." 
          className="min-h-[100px] bg-secondary/20 rounded-2xl border-none resize-none p-4 text-base font-bold"
        />
      </div>

      <div className="space-y-4 p-5 rounded-[2rem] bg-secondary/20 border border-white/5">
        <Label className="flex items-center gap-2 text-accent uppercase tracking-widest text-[10px] font-black">
          <CheckCircle2 className="size-4" /> Ladder of Success
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {SOL_STAGES.map(stage => {
            const isActive = formData.ladderOfSuccess.includes(stage);
            return (
              <button 
                key={stage} 
                type="button"
                disabled={isViewOnly}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl transition-all border text-left",
                  isActive 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                    : "bg-secondary/10 border-white/5 text-muted-foreground",
                  isViewOnly && "opacity-80"
                )} 
                onClick={() => toggleSOL(stage)}
              >
                <span className="text-xs font-black uppercase tracking-tighter">{stage}</span>
                {isActive ? <Check className="size-4" /> : <div className="size-4 rounded-full border border-white/20" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-accent uppercase tracking-widest text-[10px] font-black">
          <ClipboardList className="size-4" /> Active Goals
        </Label>
        <Input 
          readOnly={isViewOnly}
          value={formData.targetToDo} 
          onChange={e => setFormData({ ...formData, targetToDo: e.target.value })}
          placeholder="Comma separated goals..." 
          className="h-14 bg-secondary/20 rounded-2xl border-none focus-visible:ring-1 focus-visible:ring-accent/50 text-base font-bold"
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-accent uppercase tracking-widest text-[10px] font-black">
          <StickyNote className="size-4" /> Progress Notes
        </Label>
        <Textarea 
          readOnly={isViewOnly}
          value={formData.remarks} 
          onChange={e => setFormData({ ...formData, remarks: e.target.value })} 
          onKeyDown={handleNotesKeyDown}
          placeholder="Add growth observations... (Press Enter for auto-bullets)" 
          className="min-h-[140px] bg-secondary/20 rounded-2xl border-none resize-none p-4 text-base font-medium"
        />
      </div>
    </div>
  );
}

function MemberActions({ member, currentUser, onEdit, onOpen, onDelete, onChangeRole }: any) {
  const isAdmin = currentUser?.role === 'Admin';
  const isLeader = currentUser?.role === 'Leader';
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl hover:bg-secondary/50 active:scale-90 transition-all">
          <MoreHorizontal className="size-7" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-[1.75rem] border border-white/10 shadow-2xl p-2.5">
        <DropdownMenuItem onClick={onOpen} className="gap-3 p-4 rounded-xl cursor-pointer hover:bg-secondary transition-all">
          <Eye className="size-5" /> 
          <span className="font-bold">View Card</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit} className="gap-3 p-4 rounded-xl cursor-pointer hover:bg-secondary transition-all">
          <Edit className="size-5" /> 
          <span className="font-bold">Edit Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="mx-2 opacity-50" />
        
        {isAdmin && (
          <>
            <DropdownMenuItem onClick={() => onChangeRole(member.id, 'Leader')} className="gap-3 p-4 rounded-xl cursor-pointer text-accent hover:bg-secondary transition-all">
              <ShieldCheck className="size-5" /> Make Leader
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mx-2 opacity-50" />
          </>
        )}

        {(isAdmin || isLeader) && (
          <DropdownMenuItem onClick={onDelete} className="gap-3 p-4 rounded-xl cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10 transition-all">
            <Trash2 className="size-5" /> 
            <span className="font-bold">Delete</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
