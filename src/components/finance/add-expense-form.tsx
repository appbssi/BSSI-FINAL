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
import { useFirestore, useMemoFirebase, errorEmitter } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Loader2 } from 'lucide-react';
import { logActivity } from '@/lib/activity-logger';
import type { Mission } from '@/lib/types';
import { FirestorePermissionError } from '@/firebase/errors';

const expenseSchema = z.object({
  description: z.string().min(3, 'La description est requise'),
  amount: z.coerce.number().min(1, 'Montant invalide'),
  category: z.enum(['Opérationnel', 'Matériel', 'Transport', 'Logistique', 'Autre']),
  missionId: z.string().optional(),
});

export function AddExpenseForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const missionsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'missions') : null), [firestore]);
  const { data: missions } = useCollection<Mission>(missionsQuery);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { 
      description: '', 
      amount: 0, 
      category: 'Opérationnel', 
      missionId: 'none' 
    },
  });

  const onSubmit = async (values: z.infer<typeof expenseSchema>) => {
    if (!firestore) return;
    
    const expenseData = { 
      description: values.description,
      amount: values.amount,
      category: values.category,
      missionId: (values.missionId && values.missionId !== 'none') ? values.missionId : null,
      date: Timestamp.now(), 
      status: 'Validé' 
    };
    
    const expensesRef = collection(firestore, 'expenses');
    
    addDoc(expensesRef, expenseData)
      .then(() => {
        logActivity(firestore, `Nouvelle dépense enregistrée: ${values.description}`, 'Général', '/finance');
        toast({ title: 'Dépense enregistrée' });
        onSuccess();
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: expensesRef.path,
          operation: 'create',
          requestResourceData: expenseData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="Ex: Achat carburant, Réparation véhicule..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem><FormLabel>Montant (FCFA)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Catégorie</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Opérationnel">Opérationnel</SelectItem>
                  <SelectItem value="Matériel">Matériel</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                  <SelectItem value="Logistique">Logistique</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="missionId" render={({ field }) => (
          <FormItem>
            <FormLabel>Lier à une mission (Optionnel)</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Choisir une mission" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="none">Aucune mission</SelectItem>
                {missions?.filter(m => m.id).map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer la dépense
        </Button>
      </form>
    </Form>
  );
}
