// src/ai/flows/suggest-agents-for-mission.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow to suggest the most suitable agents for a given mission
 *
 * - suggestAgentsForMission - An async function that takes mission details as input and returns a list of suggested agents.
 * - SuggestAgentsForMissionInput - The input type for the suggestAgentsForMission function.
 * - SuggestAgentsForMissionOutput - The output type for the suggestAgentsForMission function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAgentsForMissionInputSchema = z.object({
  missionDetails: z.string().describe('Details of the mission, including location, time, and required skills.'),
  availableAgents: z.array(z.object({
    name: z.string(),
    skills: z.array(z.string()),
    availability: z.string(),
    pastPerformance: z.string().optional(),
  })).describe('A list of available agents with their skills, availability, and past performance.'),
});
export type SuggestAgentsForMissionInput = z.infer<typeof SuggestAgentsForMissionInputSchema>;

const SuggestAgentsForMissionOutputSchema = z.array(z.object({
  name: z.string(),
  reason: z.string().describe('Reason why this agent is suggested for the mission.'),
})).describe('A list of suggested agents with reasons for their suitability.');
export type SuggestAgentsForMissionOutput = z.infer<typeof SuggestAgentsForMissionOutputSchema>;

export async function suggestAgentsForMission(input: SuggestAgentsForMissionInput): Promise<SuggestAgentsForMissionOutput> {
  return suggestAgentsForMissionFlow(input);
}

const suggestAgentsPrompt = ai.definePrompt({
  name: 'suggestAgentsPrompt',
  input: {schema: SuggestAgentsForMissionInputSchema},
  output: {schema: SuggestAgentsForMissionOutputSchema},
  prompt: `You are an AI assistant specialized in suggesting the best agents for a mission based on their skills, availability, and past performance.

Given the following mission details:
{{{missionDetails}}}

And the following available agents:
{{#each availableAgents}}
- Name: {{this.name}}, Skills: {{#each this.skills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}, Availability: {{this.availability}}{{#if this.pastPerformance}}, Past Performance: {{this.pastPerformance}}{{/if}}
{{/each}}

Suggest the most suitable agents for the mission and provide a brief reason for each suggestion.

Format your response as a JSON array of objects, where each object has the agent's name and the reason for their suggestion.`,
});

const suggestAgentsForMissionFlow = ai.defineFlow(
  {
    name: 'suggestAgentsForMissionFlow',
    inputSchema: SuggestAgentsForMissionInputSchema,
    outputSchema: SuggestAgentsForMissionOutputSchema,
  },
  async input => {
    const {output} = await suggestAgentsPrompt(input);
    return output!;
  }
);
