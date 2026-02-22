'use client';

import { useState, useRef, useEffect } from 'react';
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
import { Camera, Loader2, User, X, AlertCircle, FlipHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { useFirestore, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { logActivity } from '@/lib/activity-logger';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

const detaineeSchema = z.object({
  lastName: z.string().min(2, 'Le nom est requis (min 2 caractères).'),
  firstName: z.string().min(2, 'Le prénom est requis (min 2 caractères).'),
  birthDate: z.string().min(1, 'La date de naissance est requise.'),
  arrestLocation: z.string().min(2, "Le lieu d'arrestation est requis."),
  arrestReason: z.string().min(5, "Le motif d'arrestation est requis (min 5 caractères)."),
});

type DetaineeFormValues = z.infer<typeof detaineeSchema>;

interface RegisterDetaineeFormProps {
  onSuccess: () => void;
}

export function RegisterDetaineeForm({ onSuccess }: RegisterDetaineeFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const form = useForm<DetaineeFormValues>({
    resolver: zodResolver(detaineeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      birthDate: '',
      arrestLocation: '',
      arrestReason: '',
    },
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setHasCameraPermission(true);
      setIsCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Accès caméra refusé',
        description: 'Veuillez autoriser l\'accès à la caméra dans les réglages de votre navigateur.',
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Mirror effect if needed (camera is front-facing)
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUri = canvas.toDataURL('image/jpeg', 0.8);
        setPhoto(dataUri);
        stopCamera();
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        toast({
          variant: 'destructive',
          title: 'Photo trop volumineuse',
          description: 'Veuillez choisir une photo de moins de 800 Ko.',
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: DetaineeFormValues) => {
    if (!firestore) return;
    
    setSubmitError(null);

    try {
      const birthDateObj = new Date(data.birthDate);
      if (isNaN(birthDateObj.getTime())) {
        throw new Error("Date de naissance invalide.");
      }

      const detaineeData = {
        lastName: data.lastName.trim().toUpperCase(),
        firstName: data.firstName.trim(),
        birthDate: Timestamp.fromDate(birthDateObj),
        photo: photo,
        entryTime: Timestamp.now(),
        arrestLocation: data.arrestLocation.trim(),
        arrestReason: data.arrestReason.trim(),
      };

      await addDoc(collection(firestore, 'detainees'), detaineeData);

      toast({
        title: 'Enregistrement réussi',
        description: `${data.firstName} ${data.lastName} a été enregistré en GAV.`,
      });

      logActivity(firestore, `Nouvel enregistrement GAV: ${data.lastName} ${data.firstName}`, 'GAV', '/gav');
      onSuccess();
    } catch (error: any) {
      console.error("Error adding detainee record:", error);
      let errorMessage = "Une erreur est survenue lors de l'enregistrement.";
      
      if (error.code === 'permission-denied') {
        errorMessage = "Permissions insuffisantes pour écrire dans la base de données.";
        const permissionError = new FirestorePermissionError({
          path: 'detainees',
          operation: 'create',
        });
        errorEmitter.emit('permission-error', permissionError);
      } else {
        errorMessage = error.message || errorMessage;
      }

      setSubmitError(errorMessage);
      toast({
        variant: 'destructive',
        title: "Échec de l'enregistrement",
        description: errorMessage,
      });
    }
  };

  const { isSubmitting } = form.formState;

  // Stop camera when component unmounts
  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="space-y-6 py-4">
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col items-center gap-4">
        {isCameraOpen ? (
          <div className="relative w-full aspect-square max-w-[240px] rounded-lg overflow-hidden bg-black border-2 border-primary">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover scale-x-[-1]" 
            />
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 px-2">
              <Button size="sm" variant="secondary" onClick={capturePhoto} className="flex-1">
                <Camera className="mr-2 h-4 w-4" /> Capturer
              </Button>
              <Button size="sm" variant="destructive" onClick={stopCamera} className="px-3">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="relative h-32 w-32 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden cursor-pointer hover:bg-muted/80 transition-colors"
            onClick={() => !photo && startCamera()}
            title="Cliquez pour prendre une photo ou uploader"
          >
            {photo ? (
              <>
                <Image src={photo} alt="Detainee photo" fill className="object-cover" />
                <button 
                  type="button"
                  className="absolute top-1 right-1 bg-background/80 rounded-full p-1 shadow-sm hover:bg-destructive hover:text-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhoto(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground text-center p-2">
                <Camera className="h-8 w-8 mb-1" />
                <span className="text-[10px]">Prendre une photo ou importer</span>
              </div>
            )}
          </div>
        )}

        {!isCameraOpen && !photo && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={startCamera}>
              <Camera className="mr-2 h-4 w-4" /> Webcam
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <User className="mr-2 h-4 w-4" /> Parcourir
            </Button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handlePhotoUpload} 
        />
        
        <p className="text-[10px] text-muted-foreground text-center">
          Optionnel. Format JPEG/PNG recommandé (max 800Ko).
        </p>
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
                    <Input placeholder="Ex: KOUASSI" {...field} autoComplete="family-name" />
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
                    <Input placeholder="Ex: Jean" {...field} autoComplete="given-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
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
            <FormField
              control={form.control}
              name="arrestLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lieu d'arrestation</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Adjamé, Pont Fer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="arrestReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motif d'arrestation</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Décrivez les faits reprochés..." 
                    className="resize-none"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement en cours...
                </>
              ) : (
                'Enregistrer en GAV'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}