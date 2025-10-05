
'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Agent } from '@/lib/types';

const agentSchema = z.object({
  firstName: z.string().min(2, 'Le prénom est requis'),
  lastName: z.string().min(2, 'Le nom est requis'),
  registrationNumber: z.string().min(3, 'Le matricule est requis'),
  rank: z.string().min(3, 'Le grade est requis'),
  contact: z.string().min(3, 'Le contact est requis'),
  address: z.string().min(3, "L'adresse est requise"),
});

type AgentFormValues = z.infer<typeof agentSchema>;

interface EditAgentSheetProps {
  agent: Agent;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function EditAgentSheet({ agent, isOpen, onOpenChange }: EditAgentSheetProps) {
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
      await updateDoc(agentRef, data);
      toast({
        title: 'Agent mis à jour !',
        description: `Les informations de l'agent ${data.firstName} ${data.lastName} ont été mises à jour.`,
      });
      onOpenChange(false);
    } catch (error) {
       console.error("Erreur lors de la mise à jour de l'agent: ", error);
       toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Une erreur est survenue lors de la mise à jour de l'agent.",
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Modifier l'agent</SheetTitle>
          <SheetDescription>
            Mettez à jour les informations de l'agent ci-dessous.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-6">
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
            <div className="flex justify-end pt-4">
              <Button type="submit">Sauvegarder les modifications</Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
