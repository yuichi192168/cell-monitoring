"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Circle, User, ChevronRight, ClipboardList, StickyNote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { SOL_STAGES } from '@/lib/types';

export function LeaderDashboard() {
  const { user } = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const teamQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'users'), where('assignedLeaderId', '==', user.id));
  }, [db, user]);

  const { data: members, loading } = useCollection(teamQuery);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground animate-pulse uppercase tracking-widest">Loading team progress...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">Team Overview</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Keep track of your group's growth and milestones.</p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {members.length > 0 ? (
          members.map((member) => {
            const solProgress = Math.round(((member.ladderOfSuccess?.length || 0) / SOL_STAGES.length) * 100);
            
            return (
              <Card key={member.id} className="glass-card flex flex-col group hover:border-accent/30 transition-colors">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center border border-border mb-3 group-hover:bg-accent/10 transition-colors">
                      <User className="size-6 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                    <Badge variant={member.status === 'Active' ? 'default' : 'outline'} className="text-[10px] uppercase font-bold tracking-wider">
                      {member.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg line-clamp-1">{member.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-6 pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span>Progress</span>
                      <span className="text-accent">{solProgress}%</span>
                    </div>
                    <Progress value={solProgress} className="h-1.5" />
                    <div className="flex flex-wrap gap-1">
                      {SOL_STAGES.map(stage => (
                        <Badge key={stage} variant={member.ladderOfSuccess?.includes(stage) ? 'default' : 'secondary'} className="text-[8px] px-1.5 py-0 border-none">
                          {stage}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <ClipboardList className="size-3" /> Current Goals
                    </p>
                    <div className="space-y-1.5">
                      {member.targetToDo?.slice(0, 2).map((todo: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-[11px] p-2 rounded-lg bg-secondary/20 border border-border/40 truncate">
                          <Circle className="size-2 text-accent mt-1 flex-shrink-0" />
                          <span className="leading-tight line-clamp-1">{todo}</span>
                        </div>
                      ))}
                      {(!member.targetToDo || member.targetToDo.length === 0) && (
                        <span className="text-[11px] text-muted-foreground italic">No goals set</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <StickyNote className="size-3" /> Notes
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-3">
                      {member.remarks || "No notes added yet."}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button variant="ghost" size="sm" className="w-full justify-between text-[11px] group/btn" onClick={() => router.push('/members')}>
                      View Full Profile
                      <ChevronRight className="size-3 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center glass-card rounded-2xl border-dashed">
            <div className="h-16 w-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
               <User className="size-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-bold">No members added</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">Start tracking your team by adding your first member.</p>
            <Button className="mt-6 h-10" onClick={() => router.push('/members')}>Add Member</Button>
          </div>
        )}
      </div>
    </div>
  );
}
