'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  suggestAgentsForMission,
  type SuggestAgentsForMissionOutput,
} from '@/ai/flows/suggest-agents-for-mission';
import { agents as allAgents } from '@/lib/data';
import type { Agent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Bot, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

const missionSchema = z.object({
  name: z.string().min(3, 'Mission name is required'),
  location: z.string().min(3, 'Location is required'),
  details: z.string().min(10, 'Details are required'),
  requiredSkills: z.string().min(3, 'At least one skill is required'),
  assignedAgents: z.array(z.string()),
});

type MissionFormValues = z.infer<typeof missionSchema>;

export function CreateMissionForm() {
  const [step, setStep] = useState(1);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedAgents, setSuggestedAgents] =
    useState<SuggestAgentsForMissionOutput>([]);
  const { toast } = useToast();

  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      name: '',
      location: '',
      details: '',
      requiredSkills: '',
      assignedAgents: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'assignedAgents',
  });

  const formData = form.watch();

  const handleSuggestAgents = async () => {
    setIsSuggesting(true);
    try {
      const missionDetails = `Name: ${formData.name}\nLocation: ${formData.location}\nDetails: ${formData.details}\nRequired Skills: ${formData.requiredSkills}`;
      const availableAgents = allAgents
        .filter((a) => a.availability === 'Available')
        .map((a) => ({
          name: a.name,
          skills: a.skills,
          availability: a.availability,
        }));

      const result = await suggestAgentsForMission({
        missionDetails,
        availableAgents,
      });
      setSuggestedAgents(result);
      toast({
        title: 'Suggestions Ready',
        description: 'We have suggested the best agents for this mission.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not get agent suggestions.',
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const nextStep = async () => {
    const isStep1Valid = await form.trigger(['name', 'location', 'details', 'requiredSkills']);
    if (step === 1 && isStep1Valid) {
      setStep(2);
      await handleSuggestAgents();
    } else if (step === 2) {
      setStep(3);
    }
  };

  const prevStep = () => setStep((s) => s - 1);

  const onSubmit = (data: MissionFormValues) => {
    console.log(data);
    toast({
        title: "Mission Created!",
        description: `Mission "${data.name}" has been successfully created.`,
    });
  };
  
  const getAgentByName = (name: string) => allAgents.find(a => a.name === name);

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">1. Mission Details</h3>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mission Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Operation Nightfall" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Geneva, Switzerland" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mission Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed description of the mission objectives."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requiredSkills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Skills</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Hacking, Surveillance, Combat (comma-separated)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">2. Assign Agents</h3>
                {isSuggesting && (
                  <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    <p>Analyzing agents...</p>
                  </div>
                )}
                {!isSuggesting && (
                  <div className="space-y-4">
                    <Card className="bg-primary/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Sparkles className="h-5 w-5 text-primary" />
                          AI Suggested Agents
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {suggestedAgents.map((agentSugg) => {
                          const agent = getAgentByName(agentSugg.name);
                          if (!agent) return null;
                          return (
                            <div key={agent.id} className="flex items-start gap-4 p-3 rounded-md border bg-background">
                              <Checkbox 
                                id={agent.id} 
                                onCheckedChange={(checked) => {
                                  return checked ? append(agent.id) : remove(fields.findIndex(field => field.value === agent.id))
                                }}
                                checked={fields.some(field => field.value === agent.id)}
                              />
                              <div className="grid gap-1.5 w-full">
                                <Label htmlFor={agent.id} className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-3">
                                      <Avatar className="h-9 w-9">
                                          <AvatarImage src={agent.avatarUrl} alt={agent.name} />
                                          <AvatarFallback>{agent.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                          <div className="font-semibold">{agent.name}</div>
                                          <div className="text-xs text-muted-foreground">{agent.skills.join(', ')}</div>
                                      </div>
                                  </div>
                                </Label>
                                <p className="text-sm text-muted-foreground pl-12"><span className="font-semibold">Reason:</span> {agentSugg.reason}</p>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                    <h4 className="font-semibold">Other Available Agents</h4>
                    <div className="space-y-2">
                        {allAgents
                          .filter(a => a.availability === 'Available' && !suggestedAgents.some(sa => sa.name === a.name))
                          .map(agent => (
                            <div key={agent.id} className="flex items-center space-x-3 p-3 rounded-md border">
                                <Checkbox 
                                  id={agent.id} 
                                  onCheckedChange={(checked) => {
                                    return checked ? append(agent.id) : remove(fields.findIndex(field => field.value === agent.id))
                                  }}
                                  checked={fields.some(field => field.value === agent.id)}
                                />
                                <Label htmlFor={agent.id} className="flex items-center gap-3 font-normal flex-1">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={agent.avatarUrl} alt={agent.name} />
                                        <AvatarFallback>{agent.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-semibold">{agent.name}</div>
                                        <div className="text-xs text-muted-foreground">{agent.skills.join(', ')}</div>
                                    </div>
                                </Label>
                            </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">3. Review and Confirm</h3>
                <Card>
                  <CardHeader>
                    <CardTitle>{formData.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p><span className="font-semibold">Location:</span> {formData.location}</p>
                    <p><span className="font-semibold">Details:</span> {formData.details}</p>
                    <p><span className="font-semibold">Required Skills:</span> {formData.requiredSkills}</p>
                    <div>
                      <h4 className="font-semibold">Assigned Agents:</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                      {formData.assignedAgents.map(agentId => {
                        const agent = allAgents.find(a => a.id === agentId);
                        if (!agent) return null;
                        return (
                          <Badge key={agent.id} variant="outline" className="flex items-center gap-2 p-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={agent.avatarUrl} />
                              <AvatarFallback>{agent.name[0]}</AvatarFallback>
                            </Avatar>
                            {agent.name}
                          </Badge>
                        )
                      })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex justify-between">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
              )}
               <div className="flex-1" />
              {step < 3 && (
                <Button type="button" onClick={nextStep}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {step === 3 && (
                <Button type="submit">Create Mission</Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
