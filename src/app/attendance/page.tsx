
"use client"

import React, { useState, useMemo } from 'react';
import { LayoutShell } from '@/components/layout-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, addDoc, where, orderBy } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import { Calendar as CalendarIcon, Users, Download, Save, UserCheck, UserMinus, ShieldCheck, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { exportToCsv } from '@/lib/export-utils';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AttendancePage() {
  const { user: currentUser } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [date, setDate] = useState<Date>(new Date());
  const [presentIds, setPresentIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'All' | 'Leader' | 'Member'>('All');

  // Load members assigned to this leader (including subordinate leaders)
  const membersQuery = useMemoFirebase(() => {
    if (!currentUser || currentUser.role === 'Member') return null;
    const usersRef = collection(db, 'users');
    
    // Admins see everyone who isn't an Admin
    if (currentUser.role === 'Admin') {
      return query(usersRef, where('role', 'in', ['Member', 'Leader']));
    }
    
    // Leaders see everyone assigned to them, regardless of their role (Members or subordinate Leaders)
    return query(usersRef, where('assignedLeaderId', '==', currentUser.id));
  }, [db, currentUser?.id, currentUser?.role]);

  const { data: membersRaw, loading: membersLoading } = useCollection(membersQuery);

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    return (membersRaw || [])
      .filter((m: any) => m.id !== currentUser?.id)
      .filter((m: any) => roleFilter === 'All' || m.role === roleFilter)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [membersRaw, currentUser?.id, roleFilter]);

  // Load past attendance for export
  const attendanceQuery = useMemoFirebase(() => {
    if (!currentUser) return null;
    return query(collection(db, 'attendance'), orderBy('date', 'desc'));
  }, [db, currentUser?.id]);

  const { data: pastAttendance } = useCollection(attendanceQuery);

  const togglePresence = (id: string) => {
    setPresentIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSaveAttendance = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    
    const attendanceData = {
      leaderId: currentUser.id,
      leaderName: currentUser.name,
      date: format(date, 'yyyy-MM-dd'),
      presentMemberIds: presentIds,
      timestamp: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'attendance'), attendanceData);
      toast({ title: "Attendance Saved", description: `Recorded for ${format(date, 'PPP')}.` });
      setPresentIds([]);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save attendance." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    if (!pastAttendance || !membersRaw) return;
    
    const exportData = pastAttendance.map((record: any) => {
      const names = record.presentMemberIds.map((id: string) => {
        const m = membersRaw.find((member: any) => member.id === id);
        return m ? m.name : 'Unknown';
      }).join('; ');
      
      return {
        Date: record.date,
        Leader: record.leaderName,
        PresentCount: record.presentMemberIds.length,
        Members: names
      };
    });

    exportToCsv(`Attendance_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`, exportData);
  };

  return (
    <LayoutShell>
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-24 sm:pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-white">Cell Attendance</h1>
            <p className="text-sm text-muted-foreground">Track attendance for your group members and subordinate leaders.</p>
          </div>
          <Button variant="outline" onClick={handleExport} className="gap-2 h-12 rounded-2xl font-bold border-white/5 active:scale-95 transition-all">
            <Download className="size-4" />
            Export to Excel
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 glass-card rounded-[2rem] border-white/5 shadow-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-secondary/10 border-b border-white/5 p-6 sm:p-8">
              <div className="space-y-1">
                <CardTitle className="text-xl font-black text-white">Mark Presence</CardTitle>
                <CardDescription>Select participants present today.</CardDescription>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="secondary" className="gap-2 h-12 rounded-xl font-bold px-4 active:scale-95">
                    <CalendarIcon className="size-4" />
                    {format(date, 'PP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-screen max-w-[320px] sm:w-auto p-0 rounded-2xl overflow-hidden shadow-2xl border-white/10 bg-card" align="end">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </CardHeader>
            
            {/* Filter Tabs */}
            <div className="px-6 sm:px-8 py-4 bg-secondary/5 border-b border-white/5">
              <Tabs defaultValue="All" className="w-full" onValueChange={(v) => setRoleFilter(v as any)}>
                <TabsList className="grid w-full grid-cols-3 bg-secondary/20 h-11 p-1 rounded-xl">
                  <TabsTrigger value="All" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Users className="size-3" /> All
                  </TabsTrigger>
                  <TabsTrigger value="Leader" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="size-3" /> Leaders
                  </TabsTrigger>
                  <TabsTrigger value="Member" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <User className="size-3" /> Members
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {membersLoading ? (
                    <div className="col-span-full py-20 text-center animate-pulse text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Loading Participants...</div>
                  ) : filteredMembers && filteredMembers.length > 0 ? (
                    filteredMembers.map((member: any) => {
                      const isPresent = presentIds.includes(member.id);
                      const isLeader = member.role === 'Leader';
                      return (
                        <button
                          key={member.id}
                          onClick={() => togglePresence(member.id)}
                          className={cn(
                            "flex items-center justify-between p-5 rounded-2xl transition-all border text-left active:scale-95",
                            isPresent 
                              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                              : "bg-secondary/10 border-white/5 text-muted-foreground hover:bg-secondary/20"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center border shrink-0",
                              isPresent ? "bg-white/20 border-white/20" : "bg-secondary border-white/5"
                            )}>
                              {isLeader ? (
                                <ShieldCheck className={cn("size-5", isPresent ? "text-white" : "text-accent")} />
                              ) : (
                                <Users className={cn("size-5", isPresent ? "text-white" : "text-muted-foreground")} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold truncate text-sm block">{member.name}</span>
                              <Badge variant="outline" className={cn(
                                "text-[8px] h-4 py-0 px-1 border-white/10",
                                isLeader ? "text-accent border-accent/20" : "text-muted-foreground/60"
                              )}>
                                {member.role}
                              </Badge>
                            </div>
                          </div>
                          {isPresent ? <UserCheck className="size-5" /> : <UserMinus className="size-5 opacity-20" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-20 text-center italic text-muted-foreground">
                      {roleFilter === 'All' ? "No participants assigned yet." : `No ${roleFilter.toLowerCase()}s found.`}
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-6 sm:p-8 bg-secondary/10 border-t border-white/5 flex justify-between items-center">
                <div className="text-sm font-bold text-muted-foreground">
                  <span className="text-accent">{presentIds.length}</span> / {filteredMembers.length} Present
                </div>
                <Button 
                  onClick={handleSaveAttendance} 
                  disabled={isSubmitting || presentIds.length === 0}
                  className="gap-2 h-14 rounded-2xl px-8 font-black shadow-xl shadow-primary/20 active:scale-95 transition-all"
                >
                  <Save className="size-5" />
                  Save Record
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Recent Sessions</h2>
            <Card className="glass-card rounded-[2rem] border-white/5 shadow-xl overflow-hidden">
              <CardContent className="p-0">
                {pastAttendance && pastAttendance.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {pastAttendance.slice(0, 5).map((record: any) => (
                      <div key={record.id} className="p-5 hover:bg-secondary/10 transition-colors space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-white">{format(new Date(record.date), 'MMM d, yyyy')}</span>
                          <Badge variant="secondary" className="text-[9px] h-5 px-2 font-bold rounded-md">
                            {record.presentMemberIds.length} Present
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate font-medium">Recorded by {record.leaderName}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-muted-foreground italic text-xs">No attendance recorded yet.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}
