"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Users, UserCheck, Activity, Search, ChevronDown, ChevronRight, MoreHorizontal, Edit, Trash2, CheckCircle2, ClipboardList, StickyNote, User } from 'lucide-react';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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

  const leaders = allUsers.filter(u => u.role === 'Leader');
  const members = allUsers.filter(u => u.role === 'Member');

  const stats = {
    totalUsers: allUsers.length,
    activeMembers: allUsers.filter(m => m.status === 'Active').length,
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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-headline font-bold">Community Overview</h1>
          <p className="text-sm text-muted-foreground">Monitoring all groups and progress across the network.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Search members..." 
            className="pl-9 bg-secondary/20"
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

      <div className="space-y-6">
        <h2 className="text-lg font-bold uppercase tracking-widest text-muted-foreground">Cell Groups</h2>
        
        <Accordion type="multiple" className="space-y-4">
          {leaders.map(leader => {
            const leaderMembers = members.filter(m => m.assignedLeaderId === leader.id && m.name.toLowerCase().includes(searchTerm.toLowerCase()));
            
            return (
              <AccordionItem key={leader.id} value={leader.id} className="border-none">
                <Card className="glass-card overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-secondary/10 transition-colors">
                    <div className="flex items-center gap-4 text-left">
                      <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                        <User className="size-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base">{leader.name}</h3>
                        <p className="text-xs text-muted-foreground uppercase tracking-tight">Cell Leader • {leaderMembers.length} Members</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-secondary/20">
                          <TableRow>
                            <TableHead className="w-[200px]">Member</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Growth Stage</TableHead>
                            <TableHead>Active Goals</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead>Added</TableHead>
                            <TableHead className="text-right">Manage</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leaderMembers.length > 0 ? (
                            leaderMembers.map(member => (
                              <TableRow key={member.id} className="hover:bg-secondary/5">
                                <TableCell className="font-medium text-sm">{member.name}</TableCell>
                                <TableCell>
                                  <Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className="text-[10px] px-2">
                                    {member.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    {SOL_STAGES.map(s => (
                                      <Badge key={s} variant={member.ladderOfSuccess?.includes(s) ? 'default' : 'outline'} className="text-[9px] h-5 px-1.5 border-none">
                                        {s[0]}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-[150px] truncate text-[11px] text-muted-foreground">
                                  {member.targetToDo?.join(', ') || '-'}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate text-[11px] text-muted-foreground italic">
                                  {member.remarks || '-'}
                                </TableCell>
                                <TableCell className="text-[10px] text-muted-foreground">
                                  {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="size-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditClick(member)} className="gap-2">
                                        <Edit className="size-4" /> Edit Profile
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleDeleteMember(member.id)} className="gap-2 text-destructive">
                                        <Trash2 className="size-4" /> Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic">
                                No members assigned to this group yet.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Member Profile</DialogTitle>
            <DialogDescription>Update progress and notes for {editingMember?.name}.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v: MemberStatus) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={formData.role} disabled className="bg-secondary/30" />
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-secondary/20 border">
              <Label className="flex items-center gap-2 text-accent uppercase tracking-wider text-[10px] font-bold">
                <CheckCircle2 className="size-4" /> Ladder of Success
              </Label>
              <div className="grid grid-cols-2 gap-4">
                {SOL_STAGES.map(stage => (
                  <div key={stage} className="flex items-center space-x-2">
                    <Checkbox id={stage} checked={formData.ladderOfSuccess.includes(stage)} onCheckedChange={() => toggleSOL(stage)} />
                    <Label htmlFor={stage} className="text-xs font-medium cursor-pointer">{stage}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-accent uppercase tracking-wider text-[10px] font-bold">
                <ClipboardList className="size-4" /> Active Goals
              </Label>
              <Input 
                value={formData.targetToDo} 
                onChange={e => setFormData({ ...formData, targetToDo: e.target.value })}
                placeholder="e.g. Finish First Step, Invite a friend" 
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-accent uppercase tracking-wider text-[10px] font-bold">
                <StickyNote className="size-4" /> Notes
              </Label>
              <Textarea 
                value={formData.remarks} 
                onChange={e => setFormData({ ...formData, remarks: e.target.value })} 
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button>
            <Button onClick={handleUpdateMember}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, label, icon: Icon }: any) {
  return (
    <Card className="glass-card transition-all hover:border-accent/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center border border-border">
          <Icon className="h-4 w-4 text-accent" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black tracking-tight">{value}</div>
        <p className="text-[10px] text-muted-foreground mt-1 font-medium">{label}</p>
      </CardContent>
    </Card>
  );
}
