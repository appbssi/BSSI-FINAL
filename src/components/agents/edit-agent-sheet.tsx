
'use client';

import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useFirestore, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Agent, Availability } from '@/lib/types';
import { Switch } from '../ui/switch';
import { Loader2 } from 'lucide-react';

const agentSchema = z.object({
  firstName: z.string().min(2, 'Le prénom est requis'),
  lastName: z.string().min(2, 'Le nom est requis'),
  registrationNumber: z.string().min(3, 'Le matricule est requis'),
  rank: z.string().min(3, 'Le grade est requis'),
  contact: z.string().length(10, 'Le contact doit contenir exactement 10 chiffres.').regex(/^[0-9]+$/, 'Le contact ne doit contenir que des chiffres.'),
  address: z.string().min(3, "L'adresse est requise"),
  onLeave: z.boolean(),
});

type AgentFormValues = z.infer<typeof agentSchema>;

interface EditAgentSheetProps {
  agent: Agent;
  onAgentEdited: () => void;
  availability: Availability;
}

export function EditAgentSheet({ agent, onAgentEdited, availability }: EditAgentSheetProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      firstName: agent.firstName,
      lastName: agent.lastName,
      registrationNumber: agent.registrationNumber,
      rank: agent.rank,
      contact: agent.contact,
      address: agent.address,
      onLeave: agent.onLeave,
    },
  });

  const onSubmit = async (data: AgentFormValues) => {
    if (!firestore) return;
    try {
      const agentsRef = collection(firestore, 'agents');
       // Check for uniqueness of registrationNumber if it has changed
      if (data.registrationNumber !== agent.registrationNumber) {
        const q = query(agentsRef, where("registrationNumber", "==", data.registrationNumber));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          form.setError('registrationNumber', {
            type: 'manual',
            message: 'Ce matricule est déjà utilisé par un autre agent.',
          });
          return;
        }
      }

      // Check for uniqueness of contact if it has changed
      if (data.contact !== agent.contact) {
        const q = query(agentsRef, where("contact", "==", data.contact));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            form.setError('contact', {
                type: 'manual',
                message: 'Ce contact est déjà utilisé par un autre agent.',
            });
            return;
        }
      }


      const agentRef = doc(firestore, 'agents', agent.id);
      updateDoc(agentRef, data).then(() => {
        toast({
            title: 'Agent mis à jour !',
            description: `Les informations de l'agent ${data.firstName} ${data.lastName} ont été mises à jour.`,
        });
        onAgentEdited();
      }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: agentRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
      
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Une erreur de validation est survenue.",
      });
    }
  };

  const { isSubmitting } = form.formState;
  const isAgentOnMission = availability === 'En mission';

  return (
    <>
      <DialogHeader>
        <DialogTitle>Modifier l'agent</DialogTitle>
        <DialogDescription>
          Mettez à jour les informations de l'agent ci-dessous.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
           <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matricule</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="onLeave"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    En congé
                  </FormLabel>
                  <FormDescription>
                    {isAgentOnMission 
                        ? "Un agent en mission ne peut pas être mis en congé." 
                        : "Marquer cet agent comme étant en congé. Il ne sera pas disponible pour les missions."
                    }
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isAgentOnMission}
                  />
                </FormControl>
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
    </>
  );
}
