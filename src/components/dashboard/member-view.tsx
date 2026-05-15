
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Target, Trophy, Clock, Milestone, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import { Badge } from '@/components/ui/badge';

export function MemberDashboard() {
  const { user } = useAuth();
  const db = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, 'users', user.id);
  }, [db, user]);

  const { data: member, loading } = useDoc(userRef);

  if (loading || !member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground uppercase tracking-widest animate-pulse">Initializing growth map...</p>
      </div>
    );
  }

  const ladderLength = member.ladderOfSuccess?.length || 0;
  const progressValue = Math.min((ladderLength / 5) * 100, 100);

  const getRoleDisplay = (role: string) => {
    if (role === 'Admin') return 'Primary Leader';
    if (role === 'Leader') return 'Cell Leader';
    return 'Cell Member';
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">Growth Map</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Track your progression and upcoming objectives.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Milestone className="size-5 text-accent" />
              Ladder of Success
            </CardTitle>
            <CardDescription>Visualizing your journey to leadership.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 px-4 sm:px-6">
            <div className="space-y-3 p-4 rounded-xl bg-secondary/20 border border-border/50">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <span>Success Trajectory</span>
                <span className="text-foreground">{Math.round(progressValue)}%</span>
              </div>
              <Progress value={progressValue} className="h-3 rounded-full" />
            </div>

            <div className="relative border-l-2 border-border/50 ml-3 pl-6 sm:pl-8 space-y-8 sm:space-y-10 pb-4">
              {member.ladderOfSuccess?.length > 0 ? (
                member.ladderOfSuccess.map((achievement: string, idx: number) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-[35px] sm:-left-[41px] top-0.5 h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-primary flex items-center justify-center border-4 border-background z-10 shadow-lg">
                      <CheckCircle2 className="size-3 sm:size-4 text-primary-foreground" />
                    </div>
                    <div className="transition-all group-hover:translate-x-1">
                      <h4 className="text-sm sm:text-base font-bold leading-none">{achievement}</h4>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 uppercase tracking-tight">Milestone achieved</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 italic text-muted-foreground text-sm">No recorded milestones in the system.</div>
              )}
              
              <div className="relative opacity-50 group">
                <div className="absolute -left-[35px] sm:-left-[41px] top-0.5 h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-secondary border-4 border-background z-10" />
                <div className="transition-all group-hover:translate-x-1">
                  <h4 className="text-sm sm:text-base font-bold leading-none">Next Strategic Milestone</h4>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 uppercase tracking-tight">Future objective</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="size-4 text-accent" />
                Active Targets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {member.targetToDo?.length > 0 ? (
                  member.targetToDo.map((todo: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary/30 border border-border/60 hover:border-accent/40 transition-colors">
                      <Clock className="size-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-medium leading-tight">{todo}</span>
                    </li>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-2 opacity-60">
                    <Target className="size-8 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground italic">No active targets set.</p>
                  </div>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-accent/30" />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="size-4 text-accent" />
                Standing
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-10">
               <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center mb-6 shadow-xl shadow-accent/5">
                 <Trophy className="size-10 text-accent" />
               </div>
               <div className="text-center space-y-1">
                 <p className="text-xl font-bold tracking-tight">{member.status}</p>
                 <Badge variant="secondary" className="text-[10px] uppercase tracking-[0.2em] font-black px-4 bg-secondary/80 border-none">
                   {getRoleDisplay(member.role)}
                 </Badge>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
