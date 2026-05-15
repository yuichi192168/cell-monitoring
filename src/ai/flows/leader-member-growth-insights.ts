'use server';
/**
 * @fileOverview This file implements a Genkit flow to generate personalized next steps and coaching focus points for members.
 *
 * - leaderMemberGrowthInsights - A function that generates growth insights for a member.
 * - LeaderMemberGrowthInsightsInput - The input type for the leaderMemberGrowthInsights function.
 * - LeaderMemberGrowthInsightsOutput - The return type for the leaderMemberGrowthInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const LeaderMemberGrowthInsightsInputSchema = z.object({
  memberId: z.string().describe('The unique identifier for the member.'),
  memberName: z.string().describe('The name of the member.'),
  ladderOfSuccessHistory: z.array(z.string()).describe('A historical list of milestones or achievements on the member\'s "Ladder of Success". Each item should be a brief description of an achieved step.'),
  targetToDoHistory: z.array(z.string()).describe('A historical list of completed "Target To Do" items for the member. Each item should be a brief description of a completed task or goal.'),
});
export type LeaderMemberGrowthInsightsInput = z.infer<typeof LeaderMemberGrowthInsightsInputSchema>;

const LeaderMemberGrowthInsightsOutputSchema = z.object({
  nextSteps: z.array(z.string()).describe('A list of personalized, actionable next steps for the member to progress further.'),
  coachingFocusPoints: z.array(z.string()).describe('A list of key areas or skills that the leader should focus on when coaching this member.'),
});
export type LeaderMemberGrowthInsightsOutput = z.infer<typeof LeaderMemberGrowthInsightsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'leaderMemberGrowthInsightsPrompt',
  input: { schema: LeaderMemberGrowthInsightsInputSchema },
  output: { schema: LeaderMemberGrowthInsightsOutputSchema },
  prompt: `You are an experienced leadership coach specializing in professional and personal development within a team-based organization.
Your goal is to analyze a member's progress and history to provide tailored next steps and coaching focus points for their leader.

Member Name: {{{memberName}}}

Here is the member's "Ladder of Success" history (achieved milestones):
{{#if ladderOfSuccessHistory}}
{{#each ladderOfSuccessHistory}}
- {{{this}}}
{{/each}}
{{else}}
No Ladder of Success history provided yet.
{{/if}}

Here is the member's "Target To Do" history (completed tasks/goals):
{{#if targetToDoHistory}}
{{#each targetToDoHistory}}
- {{{this}}}
{{/each}}
{{else}}
No Target To Do history provided yet.
{{/if}}

Based on the provided information, generate specific and actionable "nextSteps" for {{{memberName}}} to continue their growth and development.
Also, identify key "coachingFocusPoints" for their leader to emphasize during one-on-one sessions or mentorship.
Ensure the suggestions are relevant to a "Ladder of Success" and "Target To Do" framework, promoting continuous improvement and goal achievement.
The output should be a JSON object with two fields: "nextSteps" (an array of strings) and "coachingFocusPoints" (an array of strings).`
});

const leaderMemberGrowthInsightsFlow = ai.defineFlow(
  {
    name: 'leaderMemberGrowthInsightsFlow',
    inputSchema: LeaderMemberGrowthInsightsInputSchema,
    outputSchema: LeaderMemberGrowthInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function leaderMemberGrowthInsights(input: LeaderMemberGrowthInsightsInput): Promise<LeaderMemberGrowthInsightsOutput> {
  return leaderMemberGrowthInsightsFlow(input);
}
