
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
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useFirestore, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Agent, Availability } from '@/lib/types';
import { Switch } from '../ui/switch';
import { Loader2 } from 'lucide-react';
import { logActivity } from '@/lib/activity-logger';

const agentSchema = z.object({
  fullName: z.string().min(2, 'Le nom complet est requis'),
  registrationNumber: z.string().optional(),
  rank: z.string().min(3, 'Le grade est requis'),
  contact: z.string().transform(val => val.replace(/\D/g, '')).pipe(z.string().min(8, "Le contact doit contenir au moins 8 chiffres.").max(14, "Le contact ne peut pas dépasser 14 chiffres.")).optional().or(z.literal('')),
  address: z.string().min(3, "L'adresse est requise"),
  section: z.string({ required_error: "Veuillez sélectionner une section."}),
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
      fullName: agent.fullName,
      registrationNumber: agent.registrationNumber || '',
      rank: agent.rank,
      contact: agent.contact || '',
      address: agent.address,
      section: agent.section || 'Non assigné',
      onLeave: agent.onLeave,
    },
  });

  const onSubmit = async (data: AgentFormValues) => {
    if (!firestore) return;
    try {
      const agentsRef = collection(firestore, 'agents');
       // Check for uniqueness of registrationNumber if it has changed
      if (data.registrationNumber && data.registrationNumber !== agent.registrationNumber) {
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
      if (data.contact && data.contact !== agent.contact) {
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
            description: `Les informations de l'agent ${data.fullName} ont été mises à jour.`,
        });
        logActivity(firestore, `Les informations de l'agent ${data.fullName} ont été modifiées.`, 'Agent', '/agents');
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
          <FormField
              control={form.control}
              name="section"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une section" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Non assigné">NON ASSIGNÉ</SelectItem>
                      <SelectItem value="Armurerie">ARMURERIE</SelectItem>
                      <SelectItem value="Administration">ADMINISTRATION</SelectItem>
                      <SelectItem value="Officier">OFFICIER</SelectItem>
                      <SelectItem value="Adjudants">ADJUDANTS</SelectItem>
                      <SelectItem value="FAUNE">FAUNE</SelectItem>
                      <SelectItem value="CONDUCTEUR">CONDUCTEUR</SelectItem>
                      <SelectItem value="SECTION FEMININE">SECTION FEMININE</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
