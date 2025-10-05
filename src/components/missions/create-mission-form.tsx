'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  suggestAgentsForMission,
  type SuggestAgentsForMissionOutput,
} from '@/ai/flows/suggest-agents-for-mission';
import type { Agent, Mission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Sparkles, Loader2, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Label } from '../ui/label';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, Timestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useFirestore, useMemoFirebase, useUser } from '@/firebase';

const missionSchema = z.object({
  name: z.string().min(3, 'Le nom de la mission est requis'),
  location: z.string().min(3, 'Le lieu est requis'),
  startDate: z.date({
    required_error: "La date de début est requise.",
  }),
  endDate: z.date({
    required_error: "La date de fin est requise.",
  }),
  assignedAgentIds: z.array(z.string()).default([]),
});

type MissionFormValues = z.infer<typeof missionSchema>;

export function CreateMissionForm({ onMissionCreated }: { onMissionCreated?: () => void }) {
  const [step, setStep] = useState(1);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedAgents, setSuggestedAgents] =
    useState<SuggestAgentsForMissionOutput>([]);
  const [availableAgentsForMission, setAvailableAgentsForMission] = useState<Agent[]>([]);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const agentsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'agents') : null),
    [firestore, user]
  );
  const missionsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'missions') : null),
    [firestore, user]
  );

  const { data: allAgents } = useCollection<Agent>(agentsQuery);
  const { data: allMissions } = useCollection<Mission>(missionsQuery);

  const isAgentAvailable = (agent: Agent, newMission: { startDate: Date, endDate: Date }): boolean => {
    if (!newMission.startDate || !newMission.endDate || !allMissions) return agent.availability === 'Disponible';
  
    const agentMissions = allMissions.filter(mission => 
      mission.assignedAgentIds.includes(agent.id) &&
      (mission.status === 'En cours' || mission.status === 'Planification')
    );
  
    const newMissionStart = Timestamp.fromDate(newMission.startDate).seconds;
    const newMissionEnd = Timestamp.fromDate(newMission.endDate).seconds;
  
    const isOverlapping = agentMissions.some(mission =>
      (newMissionStart < mission.endDate.seconds) && (newMissionEnd > mission.startDate.seconds)
    );

    return agent.availability === 'Disponible' && !isOverlapping;
  };

  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      name: '',
      location: '',
      assignedAgentIds: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'assignedAgentIds',
  });

  const formData = form.watch();

  const handleSuggestAgents = async () => {
    if (!allAgents) return;
    setIsSuggesting(true);
    setSuggestedAgents([]);
    
    const missionDates = {
      startDate: form.getValues("startDate"),
      endDate: form.getValues("endDate")
    }
    const availableAgents = allAgents.filter(agent => isAgentAvailable(agent, missionDates));
    setAvailableAgentsForMission(availableAgents);

    try {
      const missionDetails = `Nom: ${formData.name}\nLieu: ${formData.location}\nDate de début: ${formData.startDate}\nDate de fin: ${formData.endDate}`;
      
      const agentsForAI = availableAgents.map((a) => ({
          name: a.name,
          skills: [],
          availability: 'Disponible',
          pastPerformance: '',
        }));

      if(agentsForAI.length > 0) {
        const result = await suggestAgentsForMission({
          missionDetails,
          availableAgents: agentsForAI,
        });
        setSuggestedAgents(result);
        toast({
          title: 'Suggestions prêtes',
          description: 'Nous avons suggéré les meilleurs agents pour cette mission.',
        });
      } else {
        toast({
          variant: 'default',
          title: 'Aucun agent disponible',
          description: 'Aucun agent n\'est disponible pour les dates sélectionnées.',
        });
      }

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible d'obtenir des suggestions d'agents.",
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const nextStep = async () => {
    const isStep1Valid = await form.trigger(['name', 'location', 'startDate', 'endDate']);
    if (step === 1 && isStep1Valid) {
      setStep(2);
      await handleSuggestAgents();
    } else if (step === 2) {
      setStep(3);
    }
  };

  const prevStep = () => setStep((s) => s - 1);

  const onSubmit = (data: MissionFormValues) => {
    if (!firestore) return;
    const missionsCollection = collection(firestore, 'missions');
    addDocumentNonBlocking(missionsCollection, {
      ...data,
      startDate: Timestamp.fromDate(data.startDate),
      endDate: Timestamp.fromDate(data.endDate),
      status: 'Planification',
      requiredSkills: [],
    });
    toast({
        title: "Mission créée !",
        description: `La mission "${data.name}" a été créée avec succès.`,
    });
    form.reset();
    setStep(1);
    setSuggestedAgents([]);
    setAvailableAgentsForMission([]);
    if (onMissionCreated) {
      onMissionCreated();
    }
  };
  
  const getAgentByName = (name: string) => allAgents?.find(a => a.name === name);

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0 sm:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">1. Détails de la mission</h3>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la mission</FormLabel>
                      <FormControl>
                        <Input placeholder="Opération Crépuscule" {...field} />
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
                      <FormLabel>Lieu</FormLabel>
                      <FormControl>
                        <Input placeholder="Genève, Suisse" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date de début</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: fr })
                                ) : (
                                  <span>Choisissez une date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0,0,0,0))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date de fin</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: fr })
                                ) : (
                                  <span>Choisissez une date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < (form.getValues("startDate") || new Date(new Date().setHours(0,0,0,0)))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">2. Assigner des agents</h3>
                {isSuggesting && (
                  <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    <p>Recherche d'agents disponibles...</p>
                  </div>
                )}
                {!isSuggesting && (
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {suggestedAgents.length > 0 && (
                       <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="p-4">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Agents suggérés par l'IA
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-4 pt-0">
                          {suggestedAgents.map((agentSugg) => {
                            const agent = getAgentByName(agentSugg.name);
                            if (!agent) return null;
                            return (
                              <div key={`sugg-${agent.id}`} className="flex items-start gap-4 p-3 rounded-md border bg-background">
                                <Checkbox 
                                  id={`sugg-${agent.id}`}
                                  onCheckedChange={(checked) => {
                                    const agentId = agent.id;
                                    const fieldIndex = fields.findIndex(field => field.value === agentId);
                                    if (checked) {
                                      if (fieldIndex === -1) append(agentId);
                                    } else {
                                      if (fieldIndex !== -1) remove(fieldIndex);
                                    }
                                  }}
                                  checked={fields.some(field => field.value === agent.id)}
                                />
                                <div className="grid gap-1.5 w-full">
                                  <Label htmlFor={`sugg-${agent.id}`} className="flex items-center justify-between w-full cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback>{agent.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-semibold">{agent.name}</div>
                                            <div className="text-xs text-muted-foreground">{agent.grade}</div>
                                        </div>
                                    </div>
                                  </Label>
                                  <p className="text-sm text-muted-foreground pl-12"><span className="font-semibold">Raison:</span> {agentSugg.reason}</p>
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    )}
                   
                    <h4 className="font-semibold pt-4">Autres agents disponibles</h4>
                    <div className="space-y-2">
                        {availableAgentsForMission
                          .filter(a => !suggestedAgents.some(sa => sa.name === a.name))
                          .map(agent => (
                            <div key={`avail-${agent.id}`} className="flex items-center space-x-3 p-3 rounded-md border">
                                <Checkbox 
                                  id={`avail-${agent.id}`}
                                  onCheckedChange={(checked) => {
                                    const agentId = agent.id;
                                    const fieldIndex = fields.findIndex(field => field.value === agentId);
                                    if (checked) {
                                      if (fieldIndex === -1) append(agentId);
                                    } else {
                                      if (fieldIndex !== -1) remove(fieldIndex);
                                    }
                                  }}
                                  checked={fields.some(field => field.value === agent.id)}
                                />
                                <Label htmlFor={`avail-${agent.id}`} className="flex items-center gap-3 font-normal flex-1 cursor-pointer">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback>{agent.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-semibold">{agent.name}</div>
                                        <div className="text-xs text-muted-foreground">{agent.grade}</div>
                                    </div>
                                </Label>
                            </div>
                        ))}
                         {availableAgentsForMission.length === 0 && !isSuggesting && (
                            <p className="text-sm text-muted-foreground text-center p-4 border rounded-md">
                                Aucun agent n'est disponible pour ces dates.
                            </p>
                        )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">3. Vérifier et confirmer</h3>
                <Card>
                  <CardHeader>
                    <CardTitle>{formData.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p><span className="font-semibold">Lieu:</span> {formData.location}</p>
                    {formData.startDate && <p><span className="font-semibold">Date de début:</span> {format(formData.startDate, "PPP", { locale: fr })}</p>}
                    {formData.endDate && <p><span className="font-semibold">Date de fin:</span> {format(formData.endDate, "PPP", { locale: fr })}</p>}
                    <div>
                      <h4 className="font-semibold">Agents assignés:</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                      {formData.assignedAgentIds.map(agentId => {
                        const agent = allAgents?.find(a => a.id === agentId);
                        if (!agent) return null;
                        return (
                          <Badge key={agent.id} variant="outline" className="flex items-center gap-2 p-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>{agent.name[0]}</AvatarFallback>
                            </Avatar>
                            {agent.name}
                          </Badge>
                        )
                      })}
                       {formData.assignedAgentIds.length === 0 && (
                          <p className="text-sm text-muted-foreground">Aucun agent assigné.</p>
                       )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex justify-between pt-4">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
                </Button>
              ) : <div />}
               <div className="flex-1" />
              {step < 3 ? (
                <Button type="button" onClick={nextStep} disabled={isSuggesting || !allAgents || !allMissions}>
                  {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Suivant'}
                  {!isSuggesting && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              ) : (
                <Button type="submit">Créer la mission</Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
