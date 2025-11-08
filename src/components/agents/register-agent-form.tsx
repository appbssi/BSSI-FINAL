'use client';

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useFirestore, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { Loader2 } from 'lucide-react';
import { logActivity } from '@/lib/activity-logger';

const agentSchema = z.object({
  fullName: z.string().min(2, 'Le nom complet est requis'),
  registrationNumber: z.string().min(3, 'Le matricule est requis'),
  rank: z.string().min(3, 'Le grade est requis'),
  contact: z.string()
    .transform(val => val.replace(/\D/g, '')) // Supprime les caractères non numériques
    .pipe(z.string().min(8, "Le contact doit contenir au moins 8 chiffres.").max(14, "Le contact ne peut pas dépasser 14 chiffres.")),
  address: z.string().min(3, "L'adresse est requise"),
});

type AgentFormValues = z.infer<typeof agentSchema>;

interface RegisterAgentFormProps {
  onAgentRegistered: () => void;
}


export function RegisterAgentForm({ onAgentRegistered }: RegisterAgentFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      fullName: '',
      registrationNumber: '',
      rank: '',
      contact: '',
      address: '',
    },
  });

  const onSubmit = async (data: AgentFormValues) => {
    if (!firestore) return;

    try {
      const agentsRef = collection(firestore, 'agents');
      
      const regQuery = query(agentsRef, where("registrationNumber", "==", data.registrationNumber));
      const regQuerySnapshot = await getDocs(regQuery);

      if (!regQuerySnapshot.empty) {
        form.setError('registrationNumber', {
          type: 'manual',
          message: 'Ce matricule est déjà utilisé par un autre agent.',
        });
        return; 
      }
      
      const contactQuery = query(agentsRef, where("contact", "==", data.contact));
      const contactQuerySnapshot = await getDocs(contactQuery);
      
      if (!contactQuerySnapshot.empty) {
          form.setError('contact', {
              type: 'manual',
              message: 'Ce contact est déjà utilisé par un autre agent.',
          });
          return;
      }
      
      const agentData = {
        ...data,
        onLeave: false,
      };

      addDoc(agentsRef, agentData)
        .then(() => {
            toast({
                title: 'Agent enregistré !',
                description: `L'agent ${data.fullName} a été ajouté avec succès.`,
            });
            logActivity(firestore, `L'agent ${data.fullName} a été enregistré.`, 'Agent', '/agents');
            form.reset();
            onAgentRegistered();
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: agentsRef.path,
                operation: 'create',
                requestResourceData: agentData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });

    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle Zod validation errors
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: "Une erreur inattendue est survenue.",
        });
      }
    }
  };

  const { isSubmitting } = form.formState;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Enregistrer un nouvel agent</DialogTitle>
        <DialogDescription>
          Ajoutez un nouvel agent à la brigade. Remplissez les détails ci-dessous.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom et Prénom(s)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sauvegarder l'agent
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
