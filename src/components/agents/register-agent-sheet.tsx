import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useState } from 'react';

const agentSchema = z.object({
  name: z.string().min(3, 'Le nom est requis'),
  matricule: z.string().min(3, 'Le matricule est requis'),
  grade: z.string().min(3, 'Le grade est requis'),
  contact: z.string().min(3, 'Le contact est requis'),
  address: z.string().min(3, 'L\'adresse est requise'),
  availability: z.string(),
});

type AgentFormValues = z.infer<typeof agentSchema>;

export function RegisterAgentSheet({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: '',
      matricule: '',
      grade: '',
      contact: '',
      address: '',
      availability: 'Disponible',
    },
  });

  const onSubmit = (data: AgentFormValues) => {
    if (!firestore) return;
    const agentsCollection = collection(firestore, 'agents');
    addDocumentNonBlocking(agentsCollection, data);
    toast({
      title: 'Agent enregistré !',
      description: `L'agent ${data.name} a été ajouté avec succès.`,
    });
    form.reset();
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom et Prénom</FormLabel>
                  <FormControl>
                    <Input placeholder="Alex Johnson" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="matricule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matricule</FormLabel>
                  <FormControl>
                    <Input placeholder="E-B-007" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade</FormLabel>
                  <FormControl>
                    <Input placeholder="Capitaine" {...field} />
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
                    <Input placeholder="+33 1 23 45 67 89" {...field} />
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
                    <Input placeholder="123 Rue de la Mission, Paris" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit">Sauvegarder l'agent</Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
