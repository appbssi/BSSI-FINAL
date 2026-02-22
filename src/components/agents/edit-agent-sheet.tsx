
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
import { Loader2 } from 'lucide-react';
import { logActivity } from '@/lib/activity-logger';

const agentSchema = z.object({
  fullName: z.string().min(2, 'Le nom complet est requis'),
  registrationNumber: z.string().optional(),
  rank: z.string().min(3, 'Le grade est requis'),
  contact: z.string().transform(val => val.replace(/\D/g, '')).pipe(z.string().min(8, "Le contact doit contenir au moins 8 chiffres.").max(14, "Le contact ne peut pas dépasser 14 chiffres.")).optional().or(z.literal('')),
  address: z.string().min(3, "L'adresse est requise"),
  section: z.string({ required_error: "Veuillez sélectionner une section."}),
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
    },
  });

  const onSubmit = async (data: AgentFormValues) => {
    if (!firestore) return;
    try {
      const agentsRef = collection(firestore, 'agents');

      // Check for name duplicate (excluding current agent)
      if (data.fullName.trim() !== agent.fullName) {
        const qName = query(agentsRef, where("fullName", "==", data.fullName.trim()));
        const nameSnapshot = await getDocs(qName);
        if (!nameSnapshot.empty) {
            form.setError('fullName', {
                type: 'manual',
                message: 'Ce nom est déjà utilisé par un autre agent.',
            });
            return;
        }
      }

       // Check for reg number duplicate (excluding current agent)
      if (data.registrationNumber && data.registrationNumber.trim() !== agent.registrationNumber) {
        const qReg = query(agentsRef, where("registrationNumber", "==", data.registrationNumber.trim()));
        const regSnapshot = await getDocs(qReg);

        if (!regSnapshot.empty) {
          form.setError('registrationNumber', {
            type: 'manual',
            message: 'Ce matricule est déjà utilisé par un autre agent.',
          });
          return;
        }
      }

      const agentRef = doc(firestore, 'agents', agent.id);
      const updateData = {
          ...data,
          fullName: data.fullName.trim(),
          registrationNumber: data.registrationNumber?.trim() || '',
      };

      updateDoc(agentRef, updateData).then(() => {
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
            requestResourceData: updateData,
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

  return (
    <>
      <DialogHeader>
        <DialogTitle>Modifier l'agent</DialogTitle>
        <DialogDescription>
          Mettez à jour les informations de l'agent ci-dessous. Les doublons sont vérifiés avant sauvegarde.
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
                  <FormLabel>Section (Détachement)</FormLabel>
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
                      <SelectItem value="FAUNE">FAUNE</SelectItem>
                      <SelectItem value="CONDUCTEUR">CONDUCTEUR</SelectItem>
                      <SelectItem value="SECTION FEMININE">SECTION FEMININE</SelectItem>
                      <SelectItem value="DETACHEMENT NOE">DETACHEMENT NOE</SelectItem>
                      <SelectItem value="DETACHEMENT TINGRELA">DETACHEMENT TINGRELA</SelectItem>
                      <SelectItem value="DETACHEMENT MORONDO">DETACHEMENT MORONDO</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
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
