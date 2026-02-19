'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Loader2, Search } from 'lucide-react';
import type { Agent } from '@/lib/types';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

const allocationSchema = z.object({
  agentId: z.string().min(1, 'Agent requis'),
  amount: z.coerce.number().min(1, 'Montant invalide'),
  purpose: z.string().min(3, 'Motif requis'),
});

export function AddAllocationForm({ agents, onSuccess }: { agents: Agent[], onSuccess: () => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [search, setSearch] = useState('');
  
  const form = useForm<z.infer<typeof allocationSchema>>({
    resolver: zodResolver(allocationSchema),
    defaultValues: { 
      agentId: '', 
      amount: 0, 
      purpose: '' 
    },
  });

  const filteredAgents = agents.filter(a => a.fullName.toLowerCase().includes(search.toLowerCase()));

  const onSubmit = async (values: z.infer<typeof allocationSchema>) => {
    if (!firestore) return;
    const data = { 
      agentId: values.agentId,
      amount: values.amount,
      purpose: values.purpose,
      date: Timestamp.now() 
    };
    
    const allocationsRef = collection(firestore, 'allocations');
    
    addDoc(allocationsRef, data)
      .then(() => {
        toast({ title: 'Allocation enregistrée' });
        onSuccess();
      })
      .catch((error) => {
        toast({ 
          variant: 'destructive',
          title: 'Erreur', 
          description: "Impossible d'enregistrer l'allocation." 
        });
      });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField control={form.control} name="agentId" render={({ field }) => (
          <FormItem>
            <FormLabel>Agent</FormLabel>
            <div className="relative mb-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un agent..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select onValueChange={field.onChange} value={field.value || undefined}>
              <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner l'agent" /></SelectTrigger></FormControl>
              <SelectContent>
                <ScrollArea className="h-48">
                  {filteredAgents.filter(a => a.id).map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.fullName} ({a.rank})</SelectItem>
                  ))}
                  {filteredAgents.length === 0 && (
                    <div className="p-2 text-sm text-center text-muted-foreground">Aucun agent trouvé</div>
                  )}
                </ScrollArea>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="purpose" render={({ field }) => (
          <FormItem><FormLabel>Motif de l'allocation</FormLabel><FormControl><Input placeholder="Ex: Frais de mission, Prime..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem><FormLabel>Montant (FCFA)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer l'allocation
        </Button>
      </form>
    </Form>
  );
}
