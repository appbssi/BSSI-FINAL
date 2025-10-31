'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useLogo } from '@/context/logo-context';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

const images = [
  'https://images.unsplash.com/photo-1581022221260-652ce1b1e3d6?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1611389945590-73c3d829158c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1622055109348-b0e74438b42f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1561026099-4b9319b2e04f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
];

export default function LandingPage() {
  const [currentImage, setCurrentImage] = useState(0);
  const router = useRouter();
  const { logo, isLogoLoading } = useLogo();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prevImage) => (prevImage + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (isUserLoading) {
    return (
       <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="loader"></div>
      </div>
    );
  }

  if(user) {
    router.push('/dashboard');
    return (
       <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {images.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt="Military background"
          fill
          className={cn(
            'object-cover transition-opacity duration-1000',
            index === currentImage ? 'opacity-100' : 'opacity-0'
          )}
          priority
        />
      ))}
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white">
        <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-primary/10">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/20">
                {isLogoLoading ? (
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                ) : logo ? (
                    <Image src={logo} alt="Logo" fill className="rounded-full object-cover" />
                ) : (
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                )}
            </div>
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-shadow-lg sm:text-6xl md:text-7xl" style={{fontFamily: 'Montserrat, sans-serif', textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>
            sBSSI
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-primary-foreground/80" style={{textShadow: '1px 1px 4px rgba(0,0,0,0.5)'}}>
            Système de Brigade Spéciale de Surveillance et d'Intervention
        </p>
        <Button 
            className="mt-10 px-8 py-6 text-lg font-semibold"
            onClick={() => router.push('/login')}
        >
          Entrer
        </Button>
      </div>
    </div>
  );
}
