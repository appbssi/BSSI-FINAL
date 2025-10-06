
'use client';

import { useState } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { signInAnonymously } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Loader2, Rocket, Eye, EyeOff } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { useLogo } from '@/context/logo-context';
import Image from 'next/image';
import { setRole } from '@/hooks/use-role';

const loginSchema = z.object({
  email: z.string().min(1, 'Veuillez saisir votre login.'),
  password: z.string().min(1, 'Le mot de passe est requis.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const ADMIN_LOGIN = 'bssi';
const ADMIN_PASS = 'adminR';
const OBSERVER_PASS = 'admin';


export default function LoginPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { logo, isLogoLoading } = useLogo();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const { email: login, password } = data;
      
      let userRole: 'admin' | 'observer' | null = null;

      if (login.toLowerCase() === ADMIN_LOGIN) {
        if (password === ADMIN_PASS) {
            userRole = 'admin';
        } else if (password === OBSERVER_PASS) {
            userRole = 'observer';
        }
      }

      if (userRole) {
        setRole(userRole);
        await signInAnonymously(auth);
        // AuthGuard will handle redirection
      } else {
         toast({
            variant: 'destructive',
            title: 'Erreur de connexion',
            description: "Les identifiants fournis sont invalides. Veuillez vérifier votre login et votre mot de passe.",
        });
      }

    } catch (error) {
      console.error('Login Error:', error);
      let description = "Une erreur inconnue est survenue.";
      if (error instanceof FirebaseError) {
         description = "Impossible de se connecter au service. Veuillez réessayer.";
      }
      toast({
        variant: 'destructive',
        title: 'Erreur de connexion',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      {logo && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${logo})` }}
          />
          <div className="absolute inset-0 bg-background opacity-90" />
        </>
      )}
      <Card className="z-10 w-full max-w-sm bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                    {isLogoLoading ? (
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    ) : logo ? (
                      <Image src={logo} alt="Logo" fill className="rounded-full object-cover" />
                    ) : (
                      <Rocket className="h-10 w-10 text-primary" />
                    )}
                </div>
            </div>
          <CardTitle>sBSSI</CardTitle>
          <CardDescription>Connectez-vous pour accéder à votre tableau de bord</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input type={showPassword ? 'text' : 'password'} {...field} className="pr-10" />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Se connecter
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
