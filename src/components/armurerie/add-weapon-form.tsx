
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { logActivity } from '@/lib/activity-logger';

const weaponSchema = z.object({
  serialNumber: z.string().min(3, 'N° Série requis'),
  model: z.string().min(2, 'Modèle requis'),
  type: z.enum(['Arme de poing', "Fusil d'assaut", 'Munition', 'Accessoire', 'Casque', 'Gilets par balle']),
  quantity: z.coerce.number().min(0),
});

export function AddWeaponForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const form = useForm<z.infer<typeof weaponSchema>>({
    resolver: zodResolver(weaponSchema),
    defaultValues: { serialNumber: '', model: '', type: 'Arme de poing', quantity: 1 },
  });

  const onSubmit = async (values: z.infer<typeof weaponSchema>) => {
    if (!firestore) return;
    
    const weaponData = { 
      ...values,
      status: 'Fonctionnel',
    };
    
    try {
      await addDoc(collection(firestore, 'weapons'), weaponData);
      logActivity(firestore, `Nouvel équipement ajouté : ${values.model} (${values.serialNumber})`, 'Armurerie', '/armurerie');
      toast({ title: 'Équipement enregistré' });
      onSuccess();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'enregistrer l'équipement." });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField control={form.control} name="serialNumber" render={({ field }) => (
          <FormItem><FormLabel>Numéro de Série / Lot</FormLabel><FormControl><Input placeholder="Ex: WPN-2024-001" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="model" render={({ field }) => (
          <FormItem><FormLabel>Modèle / Désignation</FormLabel><FormControl><Input placeholder="Ex: AK-47, Sig Sauer P226..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Arme de poing">Arme de poing</SelectItem>
                  <SelectItem value="Fusil d'assaut">Fusil d'assaut</SelectItem>
                  <SelectItem value="Munition">Munition</SelectItem>
                  <SelectItem value="Accessoire">Accessoire</SelectItem>
                  <SelectItem value="Casque">Casque</SelectItem>
                  <SelectItem value="Gilets par balle">Gilets par balle</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField control={form.control} name="quantity" render={({ field }) => (
            <FormItem><FormLabel>Quantité initiale</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer le matériel
        </Button>
      </form>
    </Form>
  );
}
