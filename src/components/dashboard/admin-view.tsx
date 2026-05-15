"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Users, UserCheck, Activity, Search, MoreHorizontal, Edit, Trash2, CheckCircle2, ClipboardList, StickyNote, User, Check } from 'lucide-react';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { SOL_STAGES, UserRole, MemberStatus } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit State
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    status: 'Active' as MemberStatus,
    role: 'Member' as UserRole,
    ladderOfSuccess: [] as string[],
    targetToDo: '',
    remarks: ''
  });

  const allUsersQuery = useMemoFirebase(() => {
    if (!currentUser || currentUser.role !== 'Admin') return null;
    return query(collection(db, 'users'), orderBy('name', 'asc'));
  }, [db, currentUser]);

  const { data: allUsers, loading } = useCollection(allUsersQuery);

  const leaders = (allUsers || []).filter(u => u.role === 'Leader');
  const members = (allUsers || []).filter(u => u.role === 'Member');

  const stats = {
    totalUsers: allUsers?.length || 0,
    activeMembers: (allUsers || []).filter(m => m.status === 'Active').length,
    leadersCount: leaders.length,
  };

  const handleEditClick = (member: any) => {
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

  const handleDeleteMember = (memberId: string) => {
    if (!confirm("Remove this person? This cannot be undone.")) return;
    const userRef = doc(db, 'users', memberId);
    deleteDoc(userRef).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'delete' }));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-20 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-headline font-bold">Community Overview</h1>
          <p className="text-sm text-muted-foreground">Monitoring all groups and progress across the network.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Search members..." 
            className="pl-9 bg-secondary/20 h-11 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Network" value={stats.totalUsers.toString()} label="Total individuals" icon={Users} />
        <StatCard title="Active Progress" value={stats.activeMembers.toString()} label="Currently active" icon={UserCheck} />
        <StatCard title="Group Leaders" value={stats.leadersCount.toString()} label="Assigned leaders" icon={Activity} />
      </div>

      <div className="space-y-8">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Cell Groups</h2>
        
        <div className="grid grid-cols-1 gap-6">
          {leaders.map(leader => {
            const leaderMembers = members.filter(m => m.assignedLeaderId === leader.id && (m.name.toLowerCase().includes(searchTerm.toLowerCase()) || searchTerm === ''));
            
            return (
              <Card key={leader.id} className="glass-card overflow-hidden w-full transition-all duration-300 rounded-[1.5rem] sm:rounded-[2rem] border-white/5 shadow-xl">
                <div className="px-5 sm:px-8 py-6 bg-secondary/20 border-b border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-left min-w-0">
                      <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20 shrink-0 shadow-lg">
                        <User className="size-6 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base sm:text-lg truncate tracking-tight">{leader.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">Cell Leader</p>
                          <Badge variant="secondary" className="h-4 text-[9px] px-1.5 rounded-md font-bold">{leaderMembers.length} Members</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-0">
                  <ScrollArea className="w-full">
                    <div className="min-w-[800px] w-full">
                      <Table>
                        <TableHeader className="bg-secondary/10">
                          <TableRow className="hover:bg-transparent border-white/5">
                            <TableHead className="w-[200px] font-bold py-4 pl-8">Member</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="font-bold">Growth</TableHead>
                            <TableHead className="font-bold">Targets</TableHead>
                            <TableHead className="font-bold">Notes</TableHead>
                            <TableHead className="text-right font-bold pr-8">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leaderMembers.length > 0 ? (
                            leaderMembers.map(member => (
                              <TableRow key={member.id} className="hover:bg-secondary/5 group transition-colors border-white/5">
                                <TableCell className="font-bold text-sm pl-8">
                                  <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-accent/40" />
                                    {member.name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className="text-[9px] px-2 py-0 h-5 font-bold rounded-lg">
                                    {member.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    {SOL_STAGES.map(s => (
                                      <Badge key={s} variant={member.ladderOfSuccess?.includes(s) ? 'default' : 'outline'} className="text-[8px] h-4.5 px-1.5 border-none rounded-md">
                                        {s[0]}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-[140px] truncate text-[10px] text-muted-foreground font-medium">
                                  {member.targetToDo?.join(', ') || '-'}
                                </TableCell>
                                <TableCell className="max-w-[180px] truncate text-[10px] text-muted-foreground italic leading-tight">
                                  {member.remarks || '-'}
                                </TableCell>
                                <TableCell className="text-right pr-8">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-secondary/40 active:scale-90 transition-all">
                                        <MoreHorizontal className="size-5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-[1.25rem] border shadow-2xl p-2 w-48 border-white/10">
                                      <DropdownMenuItem onClick={() => handleEditClick(member)} className="gap-2.5 p-3 cursor-pointer rounded-xl font-bold">
                                        <Edit className="size-4" /> Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator className="mx-2 opacity-50" />
                                      <DropdownMenuItem onClick={() => handleDeleteMember(member.id)} className="gap-2.5 p-3 text-destructive focus:text-destructive cursor-pointer rounded-xl font-bold">
                                        <Trash2 className="size-4" /> Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic text-xs tracking-wide">
                                No members assigned to this group yet.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <ScrollBar orientation="horizontal" className="h-2 bg-secondary/40" />
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="sm:max-w-lg w-[95%] rounded-[2.5rem] overflow-y-auto max-h-[90vh] p-0 border-white/10 shadow-2xl">
          <div className="p-6 sm:p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black">Edit Member Profile</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">Update progress and growth notes for {editingMember?.name}.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground ml-1">Full Name</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  className="h-14 bg-secondary/20 rounded-2xl border-none focus-visible:ring-1 focus-visible:ring-accent/50 transition-all" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground ml-1">Status</Label>
                  <Select value={formData.status} onValueChange={(v: MemberStatus) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className="h-14 bg-secondary/20 rounded-2xl border-none"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-white/10">
                      <SelectItem value="Active" className="rounded-xl">Active</SelectItem>
                      <SelectItem value="Inactive" className="rounded-xl">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground ml-1">Role</Label>
                  <Input value={formData.role} disabled className="h-14 bg-secondary/30 rounded-2xl border-none opacity-60" />
                </div>
              </div>

              <div className="space-y-4 p-5 rounded-[2rem] bg-secondary/20 border border-white/5 backdrop-blur-sm">
                <Label className="flex items-center gap-2 text-accent uppercase tracking-[0.15em] text-[10px] font-black">
                  <CheckCircle2 className="size-4" /> Ladder of Success
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {SOL_STAGES.map(stage => {
                    const isActive = formData.ladderOfSuccess.includes(stage);
                    return (
                      <button 
                        key={stage} 
                        type="button"
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl transition-all border text-left active:scale-[0.97]",
                          isActive 
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                            : "bg-secondary/10 border-white/5 text-muted-foreground hover:bg-white/5"
                        )} 
                        onClick={() => toggleSOL(stage)}
                      >
                        <span className="text-xs font-black uppercase tracking-tighter">{stage}</span>
                        {isActive ? <Check className="size-4 shrink-0" /> : <div className="size-4 rounded-full border border-white/20 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-accent uppercase tracking-[0.15em] text-[10px] font-black ml-1">
                  <ClipboardList className="size-4" /> Active Goals
                </Label>
                <Input 
                  value={formData.targetToDo} 
                  onChange={e => setFormData({ ...formData, targetToDo: e.target.value })}
                  placeholder="e.g. Finish Module 1, Invite a friend" 
                  className="h-14 bg-secondary/20 rounded-2xl border-none focus-visible:ring-1 focus-visible:ring-accent/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-accent uppercase tracking-[0.15em] text-[10px] font-black ml-1">
                  <StickyNote className="size-4" /> Progress Notes
                </Label>
                <Textarea 
                  value={formData.remarks} 
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })} 
                  className="min-h-[140px] bg-secondary/20 rounded-2xl border-none resize-none p-4 focus-visible:ring-1 focus-visible:ring-accent/50 transition-all"
                  placeholder="Add follow-up notes or growth milestones..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 sm:px-8 sm:pb-8 pt-0 bg-transparent flex flex-row gap-3">
            <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-white/5 hover:bg-white/5 active:scale-95 transition-all" onClick={() => setEditingMember(null)}>Cancel</Button>
            <Button className="flex-1 h-14 rounded-2xl font-black shadow-xl shadow-primary/20 active:scale-95 transition-all" onClick={handleUpdateMember}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, label, icon: Icon }: any) {
  return (
    <Card className="glass-card transition-all hover:border-accent/30 hover:translate-y-[-2px] duration-300 w-full rounded-[2rem]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-6 sm:p-8">
        <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{title}</CardTitle>
        <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center border border-white/5 shadow-inner">
          <Icon className="h-6 w-6 text-accent" />
        </div>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 pt-0">
        <div className="text-4xl font-black tracking-tighter">{value}</div>
        <p className="text-[10px] text-muted-foreground mt-1.5 font-bold uppercase tracking-widest">{label}</p>
      </CardContent>
    </Card>
  );
}
