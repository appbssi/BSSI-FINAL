
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, Timestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Loader2, Search, Info, AlertCircle } from 'lucide-react';
import type { Weapon, Agent, Mission } from '@/lib/types';
import { logActivity } from '@/lib/activity-logger';
import { useState, useMemo, useEffect } from 'react';
import { getDisplayStatus } from '@/lib/missions';
import { Label } from '@/components/ui/label';

const assignSchema = z.object({
  weaponId: z.string().min(1, 'Sélectionnez un équipement'),
  agentId: z.string().min(1, 'Sélectionnez un agent'),
  ammunitionCount: z.coerce.number().min(0, 'Nombre invalide').default(0),
  magazineCount: z.coerce.number().min(0, 'Nombre invalide').default(0),
  notes: z.string().optional(),
});

interface AssignWeaponFormProps {
  weapons: Weapon[];
  agents: Agent[];
  missions: Mission[];
  onSuccess: () => void;
}

export function AssignWeaponForm({ weapons, agents, missions, onSuccess }: AssignWeaponFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [selectedMissionId, setSelectedMissionId] = useState<string>('all');
  const [agentSearch, setAgentSearch] = useState('');
  
  const form = useForm<z.infer<typeof assignSchema>>({
    resolver: zodResolver(assignSchema),
    defaultValues: { weaponId: '', agentId: '', notes: '', ammunitionCount: 0, magazineCount: 0 },
  });

  const selectedWeaponId = form.watch('weaponId');
  const ammunitionCount = form.watch('ammunitionCount');
  
  const selectedWeapon = useMemo(() => 
    weapons.find(w => w.id === selectedWeaponId), 
    [weapons, selectedWeaponId]
  );

  const isStockInsufficient = useMemo(() => {
    if (selectedWeapon?.type === 'Munition') {
      return ammunitionCount > selectedWeapon.quantity;
    }
    return false;
  }, [selectedWeapon, ammunitionCount]);

  const activeMissions = useMemo(() => {
    if (!missions) return [];
    const now = new Date();
    return missions.filter(m => {
      const status = getDisplayStatus(m, now);
      return status === 'Planification' || status === 'En cours';
    });
  }, [missions]);

  const filteredAgents = useMemo(() => {
    let list = agents;
    
    if (selectedMissionId !== 'all') {
      const mission = activeMissions.find(m => m.id === selectedMissionId);
      if (mission) {
        list = agents.filter(a => mission.assignedAgentIds.includes(a.id));
      }
    }

    if (agentSearch) {
      list = list.filter(a => 
        a.fullName.toLowerCase().includes(agentSearch.toLowerCase()) ||
        a.registrationNumber?.toLowerCase().includes(agentSearch.toLowerCase())
      );
    }

    return list.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [agents, selectedMissionId, activeMissions, agentSearch]);

  const onSubmit = async (values: z.infer<typeof assignSchema>) => {
    if (!firestore || isStockInsufficient) return;
    
    const weapon = weapons.find(w => w.id === values.weaponId);
    const agent = agents.find(a => a.id === values.agentId);

    if (!weapon || !agent) return;

    const assignmentData = { 
      ...values,
      assignedAt: Timestamp.now(),
      returnedAt: null,
    };
    
    try {
      // 1. Créer l'attribution
      await addDoc(collection(firestore, 'weaponAssignments'), assignmentData);
      
      // 2. Déduire du stock si c'est de la munition
      if (weapon.type === 'Munition') {
        const weaponRef = doc(firestore, 'weapons', weapon.id);
        await updateDoc(weaponRef, {
          quantity: increment(-(values.ammunitionCount || 0))
        });
      }
      
      logActivity(firestore, `Attribution : ${weapon.model} assigné à ${agent.fullName} (${values.ammunitionCount} mun.)`, 'Armurerie', '/armurerie');
      toast({ title: 'Attribution réussie' });
      onSuccess();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'enregistrer l'attribution." });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        
        <div className="space-y-2">
          <Label className="text-sm font-medium">Filtrer par Mission (Actives)</Label>
          <Select value={selectedMissionId} onValueChange={setSelectedMissionId}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les missions actives" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les missions actives (Planifiées / En cours)</SelectItem>
              {activeMissions.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FormField control={form.control} name="agentId" render={({ field }) => (
          <FormItem>
            <FormLabel>Agent</FormLabel>
            <div className="relative mb-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un agent..." 
                className="pl-8" 
                value={agentSearch} 
                onChange={(e) => setAgentSearch(e.target.value)} 
              />
            </div>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Choisir un agent" /></SelectTrigger></FormControl>
              <SelectContent>
                {filteredAgents.length > 0 ? (
                  filteredAgents.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.fullName} ({a.rank})</SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>Aucun agent trouvé</SelectItem>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="weaponId" render={({ field }) => (
          <FormItem>
            <FormLabel>Équipement / Arme</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Choisir le matériel" /></SelectTrigger></FormControl>
              <SelectContent>
                {weapons.map(w => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.model} - {w.serialNumber} 
                    {w.type === 'Munition' ? ` (Stock: ${w.quantity})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="magazineCount" render={({ field }) => (
            <FormItem>
              <FormLabel>Nbre de chargeurs</FormLabel>
              <FormControl><Input type="number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="ammunitionCount" render={({ field }) => (
            <FormItem>
              <FormLabel>Nbre de munitions</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  className={isStockInsufficient ? "border-destructive text-destructive" : ""}
                />
              </FormControl>
              {selectedWeapon?.type === 'Munition' ? (
                <div className="mt-1">
                  <p className={`flex items-center gap-1 text-[10px] ${isStockInsufficient ? "text-destructive font-bold animate-pulse" : "text-primary"}`}>
                    {isStockInsufficient ? <AlertCircle className="h-3 w-3" /> : <Info className="h-3 w-3" />}
                    Stock disponible : {selectedWeapon.quantity} unités
                  </p>
                  {isStockInsufficient && (
                    <p className="text-[10px] text-destructive mt-0.5">La quantité demandée dépasse le stock disponible.</p>
                  )}
                </div>
              ) : (
                <FormDescription className="text-[10px]">Dotation accompagnant l'arme.</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem><FormLabel>Notes (facultatif)</FormLabel><FormControl><Input placeholder="Ex: Dotation mission spéciale..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={form.formState.isSubmitting || isStockInsufficient}
        >
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isStockInsufficient ? 'Stock Insuffisant' : "Confirmer l'attribution"}
        </Button>
      </form>
    </Form>
  );
}
