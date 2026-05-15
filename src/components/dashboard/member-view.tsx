
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Target, Trophy, Clock, Milestone } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';

export function MemberDashboard() {
  const { user } = useAuth();
  const db = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, 'users', user.id);
  }, [db, user]);

  const { data: member, loading } = useDoc(userRef);

  if (loading || !member) {
    return <div className="p-8 text-center text-muted-foreground">Initializing growth map...</div>;
  }

  const ladderLength = member.ladderOfSuccess?.length || 0;
  const progressValue = Math.min((ladderLength / 5) * 100, 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold">Growth Map</h1>
        <p className="text-muted-foreground">Track your progression and upcoming objectives.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Milestone className="size-5" />
              Ladder of Success
            </CardTitle>
            <CardDescription>Visualizing your journey to leadership.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Success Trajectory</span>
                <span className="font-bold">{Math.round(progressValue)}%</span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>

            <div className="relative border-l-2 border-border ml-3 pl-8 space-y-8">
              {member.ladderOfSuccess?.length > 0 ? (
                member.ladderOfSuccess.map((achievement: string, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[41px] top-1 h-5 w-5 rounded-full bg-primary border-4 border-background" />
                    <div>
                      <h4 className="text-sm font-bold">{achievement}</h4>
                      <p className="text-xs text-muted-foreground">Milestone achieved</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No milestones achieved yet.</p>
              )}
              
              <div className="relative opacity-40">
                <div className="absolute -left-[41px] top-1 h-5 w-5 rounded-full bg-secondary border-4 border-background" />
                <div>
                  <h4 className="text-sm font-bold">Next Strategic Milestone</h4>
                  <p className="text-xs text-muted-foreground">Future objective</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="size-4" />
                Active Targets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {member.targetToDo?.length > 0 ? (
                  member.targetToDo.map((todo: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                      <Clock className="size-4 text-accent mt-0.5" />
                      <span className="text-sm">{todo}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No active targets set by your leader.</p>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="size-4" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
               <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                 <Trophy className="size-8 text-accent" />
               </div>
               <p className="font-bold">{member.status}</p>
               <p className="text-xs text-muted-foreground uppercase tracking-widest">{member.role}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
