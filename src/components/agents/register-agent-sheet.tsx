
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
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Loader2 } from 'lucide-react';

const agentSchema = z.object({
  firstName: z.string().min(2, 'Le prénom est requis'),
  lastName: z.string().min(2, 'Le nom est requis'),
  registrationNumber: z.string().min(3, 'Le matricule est requis'),
  rank: z.string().min(3, 'Le grade est requis'),
  contact: z.string().min(3, 'Le contact est requis'),
  address: z.string().min(3, "L'adresse est requise"),
});

type AgentFormValues = z.infer<typeof agentSchema>;

interface RegisterAgentSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}


export function RegisterAgentSheet({ isOpen, onOpenChange }: RegisterAgentSheetProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      registrationNumber: '',
      rank: '',
      contact: '',
      address: '',
    },
  });

  const onSubmit = async (data: AgentFormValues) => {
    if (!firestore) return;

    try {
      // Check for uniqueness of registrationNumber
      const agentsRef = collection(firestore, 'agents');
      const q = query(agentsRef, where("registrationNumber", "==", data.registrationNumber));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        form.setError('registrationNumber', {
          type: 'manual',
          message: 'Ce matricule est déjà utilisé par un autre agent.',
        });
        return; // Stop submission
      }
      
      await addDoc(agentsRef, {
        ...data,
        availability: 'Disponible',
      });
      toast({
        title: 'Agent enregistré !',
        description: `L'agent ${data.firstName} ${data.lastName} a été ajouté avec succès.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'agent: ", error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Une erreur est survenue lors de l'enregistrement de l'agent.",
      });
    }
  };

  const { isSubmitting } = form.formState;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Enregistrer un nouvel agent</SheetTitle>
          <SheetDescription>
            Ajoutez un nouvel agent à la brigade. Remplissez les détails ci-dessous.
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sauvegarder l'agent
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
