
'use client';

import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Agent, Mission, Availability } from '@/lib/types';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CalendarIcon, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { collection, Timestamp, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { useCollection } from '@/firebase/firestore/use-collection';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { getAgentAvailability } from '@/lib/agents';


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

interface EditMissionSheetProps {
  mission: Mission;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function EditMissionSheet({ mission, isOpen, onOpenChange }: EditMissionSheetProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      name: mission.name,
      location: mission.location,
      startDate: mission.startDate.toDate(),
      endDate: mission.endDate.toDate(),
      assignedAgentIds: mission.assignedAgentIds || [],
    },
  });
  
  const { isSubmitting } = form.formState;

  const agentsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'agents') : null, [firestore]);
  const missionsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'missions') : null, [firestore]);
  
  const { data: allAgents, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);
  const { data: allMissions, isLoading: missionsLoading } = useCollection<Mission>(missionsQuery);
  
  useEffect(() => {
    form.reset({
      name: mission.name,
      location: mission.location,
      startDate: mission.startDate.toDate(),
      endDate: mission.endDate.toDate(),
      assignedAgentIds: mission.assignedAgentIds || [],
    });
  }, [mission, form, isOpen]);


  const onSubmit = async (data: MissionFormValues) => {
    if (!firestore || !allAgents) return;

    const batch = writeBatch(firestore);

    const missionRef = doc(firestore, 'missions', mission.id);
    const missionUpdateData = {
        ...data,
        startDate: Timestamp.fromDate(data.startDate),
        endDate: Timestamp.fromDate(data.endDate),
    };
    batch.update(missionRef, missionUpdateData);
    
    batch.commit().then(() => {
        toast({
            title: "Mission mise à jour !",
            description: `La mission "${data.name}" a été mise à jour.`,
        });
        onOpenChange(false);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: missionRef.path,
            operation: 'update',
            requestResourceData: missionUpdateData
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const startDate = form.watch('startDate');
  const endDate = form.watch('endDate');

  const agentsWithAvailability = useMemo(() => {
    if (!allAgents || !allMissions) return [];
    return allAgents.map(agent => ({
        ...agent,
        availability: getAgentAvailability(agent, allMissions, mission.id)
    }));
  }, [allAgents, allMissions, mission.id]);

  const combinedAgentList = useMemo(() => {
    if (!startDate || !endDate) return [];
    return agentsWithAvailability
      .filter(agent => {
        if (agent.onLeave) return false;

        // If agent is already in this mission, keep them in the list
        if ((mission.assignedAgentIds || []).includes(agent.id)) {
            return true;
        }

        const agentMissions = allMissions?.filter(m => 
            m.id !== mission.id &&
            m.assignedAgentIds.includes(agent.id) && 
            m.status !== 'Annulée' && 
            m.status !== 'Terminée'
        ) ?? [];

        const isOverlapping = agentMissions.some(m => {
            const missionStart = m.startDate.toDate();
            const missionEnd = m.endDate.toDate();
            return startDate < missionEnd && endDate > missionStart;
        });

        return !isOverlapping;
      })
      .sort((a,b) => a.firstName.localeCompare(b.firstName) || a.lastName.localeCompare(b.lastName));
  }, [startDate, endDate, agentsWithAvailability, allMissions, mission.id, mission.assignedAgentIds]);


  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full max-w-lg sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Modifier la mission</SheetTitle>
          <SheetDescription>
            Mettez à jour les détails et les agents assignés de la mission.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
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
            
            <Controller
                control={form.control}
                name="assignedAgentIds"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Agents assignés</FormLabel>
                    <div className="rounded-lg border">
                         <ScrollArea className="h-60">
                            <div className="p-4 space-y-2">
                            {agentsLoading || missionsLoading ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="animate-spin h-8 w-8 text-muted-foreground"/>
                                </div>
                            ) : combinedAgentList.length > 0 ? (
                                combinedAgentList.map((agent) => {
                                    const isChecked = field.value?.includes(agent.id);
                                    const isOriginallyAssigned = (mission.assignedAgentIds || []).includes(agent.id);
                                    
                                    const agentMissions = (allMissions || []).filter(m => 
                                        m.id !== mission.id &&
                                        m.assignedAgentIds.includes(agent.id) && 
                                        m.status !== 'Annulée' && 
                                        m.status !== 'Terminée'
                                    );
                                    const isOverlapping = agentMissions.some(m => {
                                        const missionStart = m.startDate.toDate();
                                        const missionEnd = m.endDate.toDate();
                                        return startDate < missionEnd && endDate > missionStart;
                                    });

                                    const isDisabled = !isOriginallyAssigned && (agent.onLeave || isOverlapping);

                                    const getBadgeVariant = (availability: Availability) => {
                                        switch (availability) {
                                        case 'Disponible':
                                            return 'outline';
                                        case 'En mission':
                                            return 'default';
                                        case 'En congé':
                                            return 'destructive';
                                        default:
                                            return 'secondary';
                                        }
                                    };

                                    return (
                                        <div
                                            key={agent.id}
                                            className={cn("flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 hover:bg-accent hover:text-accent-foreground", isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer")}
                                            onClick={() => {
                                                if(isDisabled) return;
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
                                                   {agent.rank} | {agent.registrationNumber}
                                                </div>
                                            </div>
                                             <Badge variant={getBadgeVariant(agent.availability)}>
                                                {isDisabled && !agent.onLeave ? 'Conflit' : agent.availability}
                                             </Badge>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-center text-muted-foreground p-8">Aucun agent disponible.</p>
                            )}
                            </div>
                        </ScrollArea>
                    </div>
                   <FormMessage />
                </FormItem>
                )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sauvegarder les modifications
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
