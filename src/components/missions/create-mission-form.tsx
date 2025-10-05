
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { CalendarIcon, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { collection, Timestamp, addDoc, writeBatch, doc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useState } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Agent, Mission } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';

const missionSchema = z.object({
  name: z.string().min(3, 'Le nom de la mission est requis'),
  location: z.string().min(3, 'Le lieu est requis'),
  startDate: z.date({
    required_error: "La date de début est requise.",
  }),
  endDate: z.date({
    required_error: "La date de fin est requise.",
  }),
  assignedAgentIds: z.array(z.string()).min(1, "Vous devez assigner au moins un agent."),
}).refine(data => data.endDate >= data.startDate, {
  message: "La date de fin ne peut pas être antérieure à la date de début.",
  path: ["endDate"],
});


type MissionFormValues = z.infer<typeof missionSchema>;

const isAgentAvailable = (agent: Agent, missions: Mission[], newMissionStart: Date, newMissionEnd: Date): boolean => {
    if (agent.availability === 'En congé' || agent.availability === 'En mission') {
        return false;
    }
    const agentMissions = missions.filter(mission => mission.assignedAgentIds.includes(agent.id) && mission.status !== 'Annulée' && mission.status !== 'Terminée');

    return !agentMissions.some(mission => {
        const missionStart = mission.startDate.toDate();
        const missionEnd = mission.endDate.toDate();
        // Check for overlap
        return newMissionStart < missionEnd && newMissionEnd > missionStart;
    });
};


export function CreateMissionForm({ onMissionCreated }: { onMissionCreated?: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      name: '',
      location: '',
      assignedAgentIds: [],
    },
  });
  
  const { isSubmitting } = form.formState;

  const agentsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'agents') : null, [firestore]);
  const missionsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'missions') : null, [firestore]);
  
  const { data: allAgents, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);
  const { data: allMissions, isLoading: missionsLoading } = useCollection<Mission>(missionsQuery);

  const onSubmit = async (data: MissionFormValues) => {
    if (!firestore) return;
    try {
        const batch = writeBatch(firestore);

        const missionsCollection = collection(firestore, 'missions');
        const newMissionRef = doc(missionsCollection);
        batch.set(newMissionRef, {
            ...data,
            startDate: Timestamp.fromDate(data.startDate),
            endDate: Timestamp.fromDate(data.endDate),
            status: 'Planification',
        });

        data.assignedAgentIds.forEach(agentId => {
            const agentRef = doc(firestore, 'agents', agentId);
            batch.update(agentRef, { availability: 'En mission' });
        });

        await batch.commit();

        toast({
            title: "Mission créée !",
            description: `La mission "${data.name}" a été créée avec succès.`,
        });
        form.reset();
        if (onMissionCreated) {
        onMissionCreated();
        }
    } catch (error) {
        console.error("Erreur lors de la création de la mission: ", error);
        toast({
            variant: 'destructive',
            title: 'Erreur',
            description: "Une erreur est survenue lors de la création de la mission.",
        });
    }
  };

  const handleNextStep = async () => {
    const isValid = await form.trigger(['name', 'location', 'startDate', 'endDate']);
    if (isValid) {
        setCurrentStep(2);
    }
  };
  
  const startDate = form.watch('startDate');
  const endDate = form.watch('endDate');

  const availableAgents = allAgents?.filter(agent => 
      startDate && endDate ? isAgentAvailable(agent, allMissions || [], startDate, endDate) : false
  ) || [];

  return (
    <div className="p-0 sm:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {currentStep === 1 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">1. Détails de la mission</h3>
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nom de la mission</FormLabel>
                        <FormControl>
                            <Input {...field} />
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
                            <Input {...field} />
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
                    <div className="flex justify-end pt-4">
                        <Button type="button" onClick={handleNextStep}>Suivant</Button>
                    </div>
                </div>
            )}
            
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">2. Assigner les agents</h3>
                <p className="text-sm text-muted-foreground">Sélectionnez les agents à assigner à cette mission. Seuls les agents disponibles pour les dates choisies sont affichés.</p>
                
                <Controller
                  control={form.control}
                  name="assignedAgentIds"
                  render={({ field }) => (
                    <FormItem>
                        <div className="rounded-lg border">
                             <ScrollArea className="h-72">
                                <div className="p-4 space-y-2">
                                {agentsLoading || missionsLoading ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground"/>
                                    </div>
                                ) : availableAgents.length > 0 ? (
                                    availableAgents.map((agent) => {
                                        const isChecked = field.value?.includes(agent.id);
                                        return (
                                            <div
                                                key={agent.id}
                                                className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                                onClick={() => {
                                                     const currentValues = field.value || [];
                                                     const newValue = isChecked
                                                         ? currentValues.filter((id) => id !== agent.id)
                                                         : [...currentValues, agent.id];
                                                     field.onChange(newValue);
                                                 }}
                                            >
                                                <div className={cn("h-5 w-5 flex items-center justify-center rounded border", isChecked ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground/50")}>
                                                  {isChecked && <Check className="h-4 w-4" />}
                                                </div>
                                                <div className="font-medium flex-1">
                                                    {agent.firstName} {agent.lastName}
                                                    <div className="text-sm text-muted-foreground">
                                                        {agent.rank} | {agent.registrationNumber} | {agent.contact}
                                                    </div>
                                                </div>
                                                <Badge variant={agent.availability === 'Disponible' ? 'outline' : 'secondary'}>{agent.availability}</Badge>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-center text-muted-foreground p-8">Aucun agent disponible pour ces dates.</p>
                                )}
                                </div>
                            </ScrollArea>
                        </div>
                       <FormMessage />
                    </FormItem>
                    )}
                />
                
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>Précédent</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Créer la mission
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
    </div>
  );
}
