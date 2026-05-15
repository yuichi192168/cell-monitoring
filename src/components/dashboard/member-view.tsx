
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MOCK_MEMBERS } from '@/lib/mock-data';
import { Target, Trophy, Clock, Milestone } from 'lucide-react';

export function MemberDashboard() {
  const member = MOCK_MEMBERS[0]; // Self reference for demo
  const progressValue = (member.ladderOfSuccess.length / 5) * 100;

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
                <span>Phase 1 Completion</span>
                <span className="font-bold">{progressValue}%</span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>

            <div className="relative border-l-2 border-border ml-3 pl-8 space-y-8">
              {member.ladderOfSuccess.map((achievement, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[41px] top-1 h-5 w-5 rounded-full bg-primary border-4 border-background" />
                  <div>
                    <h4 className="text-sm font-bold">{achievement}</h4>
                    <p className="text-xs text-muted-foreground">Milestone achieved</p>
                  </div>
                </div>
              ))}
              <div className="relative opacity-40">
                <div className="absolute -left-[41px] top-1 h-5 w-5 rounded-full bg-secondary border-4 border-background" />
                <div>
                  <h4 className="text-sm font-bold">Cell Leadership Training</h4>
                  <p className="text-xs text-muted-foreground">Upcoming goal</p>
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
                {member.targetToDo.map((todo, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                    <Clock className="size-4 text-accent mt-0.5" />
                    <span className="text-sm">{todo}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="size-4" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
               <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                 <Trophy className="size-8 text-accent" />
               </div>
               <p className="font-bold">Member of the Month</p>
               <p className="text-xs text-muted-foreground">Awarded Feb 2024</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
