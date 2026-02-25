
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Loader2 } from 'lucide-react';
import type { Weapon, Agent } from '@/lib/types';
import { logActivity } from '@/lib/activity-logger';

const assignSchema = z.object({
  weaponId: z.string().min(1, 'Sélectionnez un équipement'),
  agentId: z.string().min(1, 'Sélectionnez un agent'),
  notes: z.string().optional(),
});

interface AssignWeaponFormProps {
  weapons: Weapon[];
  agents: Agent[];
  onSuccess: () => void;
}

export function AssignWeaponForm({ weapons, agents, onSuccess }: AssignWeaponFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const form = useForm<z.infer<typeof assignSchema>>({
    resolver: zodResolver(assignSchema),
    defaultValues: { weaponId: '', agentId: '', notes: '' },
  });

  const onSubmit = async (values: z.infer<typeof assignSchema>) => {
    if (!firestore) return;
    
    const assignmentData = { 
      ...values,
      assignedAt: Timestamp.now(),
      returnedAt: null,
    };
    
    try {
      await addDoc(collection(firestore, 'weaponAssignments'), assignmentData);
      
      const weapon = weapons.find(w => w.id === values.weaponId);
      const agent = agents.find(a => a.id === values.agentId);
      
      logActivity(firestore, `Attribution : ${weapon?.model} assigné à ${agent?.fullName}`, 'Armurerie', '/armurerie');
      toast({ title: 'Attribution réussie' });
      onSuccess();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'enregistrer l'attribution." });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField control={form.control} name="agentId" render={({ field }) => (
          <FormItem>
            <FormLabel>Agent</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Choisir un agent" /></SelectTrigger></FormControl>
              <SelectContent>
                {agents.sort((a,b) => a.fullName.localeCompare(b.fullName)).map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.fullName} ({a.rank})</SelectItem>
                ))}
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
                  <SelectItem key={w.id} value={w.id}>{w.model} - {w.serialNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem><FormLabel>Notes (facultatif)</FormLabel><FormControl><Input placeholder="Ex: Dotation mission spéciale..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirmer l'attribution
        </Button>
      </form>
    </Form>
  );
}
