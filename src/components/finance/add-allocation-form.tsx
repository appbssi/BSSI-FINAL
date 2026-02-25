'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { collection, Timestamp, writeBatch, doc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Loader2, Search } from 'lucide-react';
import type { Agent, Mission } from '@/lib/types';
import { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getDisplayStatus } from '@/lib/missions';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const allocationSchema = z.object({
  agentIds: z.array(z.string()).min(1, 'Veuillez sélectionner au moins un agent'),
  amount: z.coerce.number().min(1, 'Montant invalide'),
  purpose: z.string().min(3, 'Motif requis'),
  missionId: z.string().optional(),
});

export function AddAllocationForm({ agents, onSuccess }: { agents: Agent[], onSuccess: () => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [search, setSearch] = useState('');
  const [selectedMissionId, setSelectedMissionId] = useState<string>('all');
  
  const missionsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'missions') : null), [firestore]);
  const { data: missions } = useCollection<Mission>(missionsQuery);

  const plannedMissions = useMemo(() => {
    if (!missions) return [];
    const now = new Date();
    return missions.filter(m => getDisplayStatus(m, now) === 'Planification');
  }, [missions]);

  const form = useForm<z.infer<typeof allocationSchema>>({
    resolver: zodResolver(allocationSchema),
    defaultValues: { 
      agentIds: [], 
      amount: 0, 
      purpose: '',
      missionId: 'all'
    },
  });

  const filteredAgents = useMemo(() => {
    let list = agents;
    
    // Filtrer par mission sélectionnée
    if (selectedMissionId !== 'all') {
      const mission = plannedMissions.find(m => m.id === selectedMissionId);
      if (mission) {
        list = agents.filter(a => mission.assignedAgentIds.includes(a.id));
      }
    } else {
      // Si aucune mission spécifique n'est choisie, on montre les agents en planification
      const allPlannedAgentIds = new Set<string>();
      plannedMissions.forEach(m => m.assignedAgentIds.forEach(id => allPlannedAgentIds.add(id)));
      list = agents.filter(a => allPlannedAgentIds.has(a.id));
    }

    return list.filter(a => a.fullName.toLowerCase().includes(search.toLowerCase()));
  }, [agents, selectedMissionId, plannedMissions, search]);

  const onSubmit = async (values: z.infer<typeof allocationSchema>) => {
    if (!firestore) return;
    
    const batch = writeBatch(firestore);
    const allocationsRef = collection(firestore, 'allocations');
    
    values.agentIds.forEach(agentId => {
      const newAllocationRef = doc(allocationsRef);
      batch.set(newAllocationRef, { 
        agentId,
        amount: values.amount,
        purpose: values.purpose,
        date: Timestamp.now() 
      });
    });
    
    try {
      await batch.commit();
      toast({ 
        title: 'Allocations enregistrées', 
        description: `${values.agentIds.length} agent(s) ont reçu l'allocation de ${values.amount.toLocaleString('fr-FR')} FCFA.`
      });
      onSuccess();
    } catch (error) {
      toast({ 
        variant: 'destructive',
        title: 'Erreur', 
        description: "Impossible d'enregistrer les allocations." 
      });
    }
  };

  const selectedAgentIds = form.watch('agentIds');
  const currentAmount = form.watch('amount');

  const handleToggleAgent = (agentId: string) => {
    const current = form.getValues('agentIds');
    if (current.includes(agentId)) {
      form.setValue('agentIds', current.filter(id => id !== agentId));
    } else {
      form.setValue('agentIds', [...current, agentId]);
    }
  };

  const handleSelectAll = () => {
    form.setValue('agentIds', filteredAgents.map(a => a.id));
  };

  const handleClearAll = () => {
    form.setValue('agentIds', []);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        
        <div className="space-y-2">
          <FormLabel>Filtrer par Mission (Générée)</FormLabel>
          <Select value={selectedMissionId} onValueChange={(val) => {
            setSelectedMissionId(val);
            form.setValue('agentIds', []); // Reset agent selection when mission changes
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les missions planifiées" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les missions planifiées</SelectItem>
              {plannedMissions.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            Sélectionnez une mission pour voir uniquement les agents qui y sont désignés.
          </FormDescription>
        </div>

        <FormField control={form.control} name="agentIds" render={({ field }) => (
          <FormItem>
            <FormLabel>Agents désignés ({selectedAgentIds.length} sélectionnés)</FormLabel>
            <div className="relative mb-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un agent..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <ScrollArea className="h-48">
                <div className="p-2 space-y-1">
                  {filteredAgents.length > 0 ? (
                    filteredAgents.map(a => (
                      <div 
                        key={a.id} 
                        className={cn(
                          "flex items-center space-x-3 p-2 rounded-sm cursor-pointer transition-colors hover:bg-accent",
                          selectedAgentIds.includes(a.id) && "bg-accent/50"
                        )}
                        onClick={() => handleToggleAgent(a.id)}
                      >
                        <Checkbox 
                          checked={selectedAgentIds.includes(a.id)} 
                          onCheckedChange={() => handleToggleAgent(a.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{a.fullName}</span>
                          <span className="text-xs text-muted-foreground">{a.rank} | {a.registrationNumber}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-center text-muted-foreground">Aucun agent trouvé</div>
                  )}
                </div>
              </ScrollArea>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>Tout sélectionner</Button>
                <Button type="button" variant="outline" size="sm" className="text-destructive" onClick={handleClearAll}>Effacer</Button>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="purpose" render={({ field }) => (
          <FormItem><FormLabel>Motif de l'allocation</FormLabel><FormControl><Input placeholder="Ex: Frais de mission, Prime..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem><FormLabel>Montant par agent (FCFA)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        {selectedAgentIds.length > 0 && currentAmount > 0 && (
          <div className="p-3 bg-primary/10 rounded-lg text-sm font-bold text-primary">
            Total à verser : {(currentAmount * selectedAgentIds.length).toLocaleString('fr-FR')} FCFA
          </div>
        )}

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || selectedAgentIds.length === 0}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer les allocations ({selectedAgentIds.length})
        </Button>
      </form>
    </Form>
  );
}