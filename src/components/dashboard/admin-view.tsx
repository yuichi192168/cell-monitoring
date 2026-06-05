"use client"

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, doc, updateDoc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { Users, UserCheck, Activity, Search, MoreHorizontal, Edit, Trash2, User, Check, History, Clock, Fingerprint, Eye } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SOL_STAGES, UserRole, MemberStatus, ActivityLog } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { recordActivityLog } from '@/firebase/activity-logs';
import { formatDistanceToNow } from 'date-fns';

export function AdminDashboard() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    status: 'Active' as MemberStatus,
    role: 'Member' as UserRole,
    ladderOfSuccess: [] as string[],
    targetToDo: '',
    remarks: '',
    characteristics: ''
  });

  const allUsersQuery = useMemoFirebase(() => {
    if (!currentUser || currentUser.role !== 'Admin') return null;
    return query(collection(db, 'users'));
  }, [db, currentUser?.id, currentUser?.role]);

  const activityLogsQuery = useMemoFirebase(() => {
    if (!currentUser || currentUser.role !== 'Admin') return null;
    return query(
      collection(db, 'activityLogs'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
  }, [db, currentUser?.id, currentUser?.role]);

  const { data: allUsersRaw, loading: dataLoading } = useCollection(allUsersQuery);
  const { data: activityLogsRaw, loading: logsLoading } = useCollection(activityLogsQuery);

  const loading = authLoading || dataLoading;

  const allUsersSorted = useMemo(() => {
    return (allUsersRaw || []).sort((a: any, b: any) => 
      (a.name || '').localeCompare(b.name || '')
    );
  }, [allUsersRaw]);

  const activityLogs = (activityLogsRaw as ActivityLog[]) || [];

  const leaders = useMemo(() => allUsersSorted.filter(u => u.role === 'Leader'), [allUsersSorted]);
  const members = useMemo(() => allUsersSorted.filter(u => u.role === 'Member'), [allUsersSorted]);

  const stats = useMemo(() => ({
    totalUsers: allUsersSorted.length || 0,
    activeMembers: allUsersSorted.filter(m => m.status === 'Active').length,
    leadersCount: leaders.length,
  }), [allUsersSorted, leaders]);

  const unlockUI = () => {
    setTimeout(() => {
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
      }
    }, 300);
  };

  const handleOpenCard = (member: any, viewOnly: boolean = true) => {
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

  const handleUpdateMember = () => {
    if (!editingMember || !currentUser) return;
    setIsSubmitting(true);
    
    const targets = formData.targetToDo.split(',').map(t => t.trim()).filter(Boolean);
    const updatePayload = { ...formData, targetToDo: targets };

    const userRef = doc(db, 'users', editingMember.id);
    updateDoc(userRef, updatePayload)
      .then(() => {
        toast({ title: "Record Updated", description: "Successfully synced." });
        recordActivityLog(db, {
          actorId: currentUser.id,
          actorName: currentUser.name,
          action: 'update',
          targetId: editingMember.id,
          targetName: formData.name,
          details: `Admin updated profile for ${formData.name}`
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
        unlockUI();
      });
  };

  const confirmDelete = () => {
    if (!memberToDelete || !currentUser) return;
    setIsSubmitting(true);
    const userRef = doc(db, 'users', memberToDelete.id);
    deleteDoc(userRef)
      .then(() => {
        toast({ title: "Record Deleted", description: "User has been removed." });
        recordActivityLog(db, {
          actorId: currentUser.id,
          actorName: currentUser.name,
          action: 'delete',
          targetId: memberToDelete.id,
          targetName: memberToDelete.name,
          details: `Admin deleted member: ${memberToDelete.name}`
        });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'delete' }));
      })
      .finally(() => {
        setIsSubmitting(false);
        setMemberToDelete(null);
        unlockUI();
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
          <h1 className="text-2xl sm:text-3xl font-headline font-bold text-white">Overview</h1>
          <p className="text-sm text-muted-foreground">Monitoring progress.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            className="pl-9 bg-secondary/20 h-11 rounded-xl text-white border-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total" value={stats.totalUsers.toString()} label="Total users" icon={Users} />
        <StatCard title="Active" value={stats.activeMembers.toString()} label="Active progress" icon={UserCheck} />
        <StatCard title="Leaders" value={stats.leadersCount.toString()} label="Cell leaders" icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Cell Groups</h2>
          
          <div className="space-y-6">
            {leaders.map(leader => {
              const leaderMembers = members.filter(m => m.assignedLeaderId === leader.id && (m.name.toLowerCase().includes(searchTerm.toLowerCase()) || searchTerm === ''));
              return (
                <Card key={leader.id} className="glass-card overflow-hidden w-full rounded-[1.5rem] sm:rounded-[2rem] border-white/5 shadow-xl">
                  <div className="px-5 sm:px-8 py-6 bg-secondary/20 border-b border-white/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 text-left min-w-0">
                        <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20 shrink-0">
                          <User className="size-6 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-base sm:text-lg truncate tracking-tight text-white">{leader.name}</h3>
                          <Badge variant="secondary" className="h-4 text-[9px] px-1.5 rounded-md font-bold">{leaderMembers.length} Members</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-0">
                    <ScrollArea className="w-full">
                      <div className="min-w-[800px] w-full pb-2">
                        <Table>
                          <TableHeader className="bg-secondary/10">
                            <TableRow className="border-white/5">
                              <TableHead className="w-[200px] font-bold py-4 pl-8 text-muted-foreground">Member</TableHead>
                              <TableHead className="font-bold text-muted-foreground">Status</TableHead>
                              <TableHead className="font-bold text-muted-foreground">Growth</TableHead>
                              <TableHead className="font-bold text-muted-foreground">Targets</TableHead>
                              <TableHead className="font-bold text-muted-foreground">Notes</TableHead>
                              <TableHead className="text-right font-bold pr-8 text-muted-foreground">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {leaderMembers.map(member => (
                              <TableRow key={member.id} onClick={() => handleOpenCard(member, true)} className="hover:bg-secondary/5 transition-colors border-white/5 cursor-pointer">
                                <TableCell className="font-bold text-sm pl-8 text-white">{member.name}</TableCell>
                                <TableCell><Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className="text-[9px] px-2 py-0 h-5 font-bold rounded-lg">{member.status}</Badge></TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    {SOL_STAGES.map(s => (
                                      <Badge key={s} variant={member.ladderOfSuccess?.includes(s) ? 'default' : 'secondary'} className="text-[8px] h-4.5 px-1.5 border-none rounded-md">{s[0]}</Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-[140px] truncate text-[10px] text-muted-foreground">{member.targetToDo?.join(', ') || '-'}</TableCell>
                                <TableCell className="max-w-[180px] truncate text-[10px] text-muted-foreground italic">{member.remarks || '-'}</TableCell>
                                <TableCell className="text-right pr-8" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-secondary/40 active:scale-90 transition-all">
                                        <MoreHorizontal className="size-5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-[1.25rem] border shadow-2xl p-2 w-48 border-white/10 bg-card">
                                      <DropdownMenuItem onClick={() => handleOpenCard(member, true)} className="gap-2.5 p-3 cursor-pointer rounded-xl font-bold text-white"><Eye className="size-4" /> View Card</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleOpenCard(member, false)} className="gap-2.5 p-3 cursor-pointer rounded-xl font-bold text-white"><Edit className="size-4" /> Edit Profile</DropdownMenuItem>
                                      <DropdownMenuSeparator className="mx-2 opacity-50" />
                                      <DropdownMenuItem onClick={() => setMemberToDelete(member)} className="gap-2.5 p-3 text-destructive cursor-pointer rounded-xl font-bold"><Trash2 className="size-4" /> Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
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

        <div className="space-y-8">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground px-1 flex items-center gap-2">
            <History className="size-4" /> Activity Feed
          </h2>
          <Card className="glass-card rounded-[2rem] border-white/5 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              {logsLoading ? (
                <div className="p-8 text-center animate-pulse text-muted-foreground">Loading activity...</div>
              ) : activityLogs.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="p-5 hover:bg-secondary/10 transition-colors space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-xs font-black tracking-tight leading-tight text-white">
                          <span className="text-accent">{log.actorName}</span>
                          <span className="text-muted-foreground font-medium mx-1.5">
                            {log.action === 'create' ? 'enrolled' : log.action === 'update' ? 'updated' : 'removed'}
                          </span>
                          <span className="text-foreground">{log.targetName}</span>
                        </p>
                        <Badge variant="outline" className="text-[8px] h-4 py-0 font-bold opacity-50 uppercase tracking-tighter text-muted-foreground">
                          {log.action}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-medium">
                        <Clock className="size-3" />
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground italic text-xs">No recent activity found.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!editingMember} onOpenChange={(open) => { if(!open) { setEditingMember(null); unlockUI(); } }}>
        <DialogContent className="sm:max-w-lg w-[95%] rounded-[2.5rem] overflow-y-auto max-h-[90vh] p-0 border-white/10 shadow-2xl bg-card">
          <div className="p-6 sm:p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-white">{isViewOnly ? 'Member View' : 'Member Card'}</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                {isViewOnly ? 'Reviewing progress and targets.' : 'Full progress history.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Full Name</Label>
                <Input readOnly={isViewOnly} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="h-14 bg-secondary/20 rounded-2xl border-none text-white font-bold" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-black text-accent flex items-center gap-2">
                  <Fingerprint className="size-3" /> Characteristics
                </Label>
                <Input readOnly={isViewOnly} value={formData.characteristics} onChange={e => setFormData({ ...formData, characteristics: e.target.value })} className="h-14 bg-secondary/20 rounded-2xl border-none text-white font-bold" />
              </div>

              <div className="space-y-4 p-5 rounded-[2rem] bg-secondary/20 border border-white/5">
                <div className="grid grid-cols-2 gap-3">
                  {SOL_STAGES.map(stage => {
                    const isActive = formData.ladderOfSuccess.includes(stage);
                    return (
                      <button 
                        key={stage} 
                        type="button" 
                        disabled={isViewOnly}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl transition-all border", 
                          isActive ? "bg-primary text-primary-foreground" : "bg-secondary/10 border-white/5 text-muted-foreground",
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
                <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Progress Notes</Label>
                <Textarea readOnly={isViewOnly} value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} className="min-h-[140px] bg-secondary/20 rounded-2xl border-none text-white" />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 sm:px-8 sm:pb-8 pt-0 flex flex-row gap-3">
            <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-white/5" onClick={() => setEditingMember(null)}>Close</Button>
            {!isViewOnly && (
              <Button className="flex-1 h-14 rounded-2xl font-black shadow-xl" onClick={handleUpdateMember} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => { if(!open) { setMemberToDelete(null); unlockUI(); } }}>
        <AlertDialogContent className="rounded-[2rem] border-white/10 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-white">Delete Member?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-muted-foreground">Remove {memberToDelete?.name} permanently.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-white/5 h-12">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-destructive h-12 font-black" disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ title, value, label, icon: Icon }: any) {
  return (
    <Card className="glass-card rounded-[2rem]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 sm:p-8 pb-3">
        <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{title}</CardTitle>
        <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center border border-white/5">
          <Icon className="h-6 w-6 text-accent" />
        </div>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 pt-0">
        <div className="text-4xl font-black tracking-tighter text-white">{value}</div>
        <p className="text-[10px] text-muted-foreground mt-1.5 font-bold uppercase tracking-widest">{label}</p>
      </CardContent>
    </Card>
  );
}
