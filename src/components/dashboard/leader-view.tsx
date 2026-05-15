
"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { MOCK_MEMBERS } from '@/lib/mock-data';
import { Sparkles, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { leaderMemberGrowthInsights, LeaderMemberGrowthInsightsOutput } from '@/ai/flows/leader-member-growth-insights';
import { Member } from '@/lib/types';

export function LeaderDashboard() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [aiInsight, setAiInsight] = useState<LeaderMemberGrowthInsightsOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInsight = async (member: Member) => {
    setSelectedMember(member);
    setIsGenerating(true);
    setAiInsight(null);
    try {
      const result = await leaderMemberGrowthInsights({
        memberId: member.id,
        memberName: member.name,
        ladderOfSuccessHistory: member.ladderOfSuccess,
        targetToDoHistory: member.targetToDo
      });
      setAiInsight(result);
    } catch (error) {
      console.error("AI Insight failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold">Pod Monitor</h1>
        <p className="text-muted-foreground">Manage and coach your assigned members.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {MOCK_MEMBERS.filter(m => m.role === 'Member').map((member) => (
          <Card key={member.id} className="glass-card flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center font-bold text-lg mb-2 border border-border">
                  {member.name.substring(0, 2)}
                </div>
                <Badge variant={member.status === 'Active' ? 'default' : 'outline'}>
                  {member.status}
                </Badge>
              </div>
              <CardTitle>{member.name}</CardTitle>
              <CardDescription>{member.email}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 tracking-wide">Milestones</p>
                <div className="flex flex-wrap gap-1.5">
                  {member.ladderOfSuccess.map((step, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[10px]">{step}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 tracking-wide">Target To-Do</p>
                <div className="space-y-1.5">
                  {member.targetToDo.map((todo, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Circle className="size-3 text-muted-foreground" />
                      <span>{todo}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                variant="outline" 
                className="w-full gap-2 border-primary/20 hover:border-primary/50 group"
                onClick={() => generateInsight(member)}
              >
                <Sparkles className="size-4 text-accent transition-transform group-hover:scale-110" />
                Get AI Growth Insights
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-accent" />
              Growth Insights: {selectedMember?.name}
            </DialogTitle>
            <DialogDescription>
              AI-generated strategy based on current progress and targets.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 min-h-[300px] flex flex-col">
            {isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                <p className="text-sm text-muted-foreground">Analyzing growth patterns and milestones...</p>
              </div>
            ) : aiInsight ? (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                <section>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-accent mb-3">Recommended Next Steps</h4>
                  <ul className="space-y-3">
                    {aiInsight.nextSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-3 bg-secondary/30 p-3 rounded-lg border border-border/30">
                        <CheckCircle2 className="size-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-accent mb-3">Coaching Focus Points</h4>
                  <ul className="space-y-3">
                    {aiInsight.coachingFocusPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3 bg-secondary/30 p-3 rounded-lg border border-border/30">
                        <ArrowRight className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            ) : (
              <p className="text-center text-muted-foreground italic">Failed to load insights. Please try again.</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMember(null)}>Close Insight</Button>
            <Button className="gap-2">
              Add to Targets
              <ArrowRight className="size-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
