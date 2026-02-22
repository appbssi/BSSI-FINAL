
'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Camera, Loader2, User, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { useFirestore, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { logActivity } from '@/lib/activity-logger';
import Image from 'next/image';

const detaineeSchema = z.object({
  lastName: z.string().min(2, 'Le nom est requis.'),
  firstName: z.string().min(2, 'Le prénom est requis.'),
  birthDate: z.string().min(1, 'La date de naissance est requise.'),
});

type DetaineeFormValues = z.infer<typeof detaineeSchema>;

interface RegisterDetaineeFormProps {
  onSuccess: () => void;
}

export function RegisterDetaineeForm({ onSuccess }: RegisterDetaineeFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<DetaineeFormValues>({
    resolver: zodResolver(detaineeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      birthDate: '',
    },
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: DetaineeFormValues) => {
    if (!firestore) return;

    const detaineeData = {
      lastName: data.lastName,
      firstName: data.firstName,
      birthDate: Timestamp.fromDate(new Date(data.birthDate)),
      photo: photo,
      entryTime: Timestamp.now(),
    };

    addDoc(collection(firestore, 'detainees'), detaineeData)
      .then(() => {
        toast({
          title: 'Enregistrement réussi',
          description: `La personne a été enregistrée en GAV.`,
        });
        logActivity(firestore, `Nouvel enregistrement GAV: ${data.lastName} ${data.firstName}`, 'GAV', '/gav');
        onSuccess();
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: 'detainees',
          operation: 'create',
          requestResourceData: detaineeData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const { isSubmitting } = form.formState;

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col items-center gap-4">
        <div 
          className="relative h-32 w-32 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden cursor-pointer hover:bg-muted/80 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {photo ? (
            <>
              <Image src={photo} alt="Detainee photo" fill className="object-cover" />
              <button 
                className="absolute top-1 right-1 bg-background/80 rounded-full p-1 shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setPhoto(null);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center text-muted-foreground">
              <Camera className="h-8 w-8 mb-1" />
              <span className="text-xs">Ajouter une photo</span>
            </div>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handlePhotoUpload} 
        />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: KOUASSI" {...field} />
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
                  <FormLabel>Prénom(s)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Jean" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de naissance</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end pt-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer en GAV
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
