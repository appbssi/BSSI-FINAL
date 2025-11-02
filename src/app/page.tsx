'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useLogo } from '@/context/logo-context';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useIsMounted } from '@/hooks/use-is-mounted';

const images = [
  'https://i.imgur.com/kPlJEwW.jpeg',
  'https://i.imgur.com/VidHWmL.jpeg',
  'https://i.imgur.com/aEXY1F2.jpeg',
  'https://i.imgur.com/ZnJVbg4.jpeg',
  'https://i.imgur.com/p0CP2p6.jpeg',
];

export default function LandingPage() {
  const [currentImage, setCurrentImage] = useState(0);
  const { logo, isLogoLoading } = useLogo();
  const { isUserLoading } = useUser();
  const isMounted = useIsMounted();
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prevImage) => (prevImage + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleEnterClick = () => {
    router.push('/login');
  };

  if (!isMounted || isUserLoading || isLogoLoading) {
    return (
       <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
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

      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
        
        <div className="transition-all duration-500 opacity-100 scale-100">
            <div className="mx-auto mb-6 h-28 w-28 flex items-center justify-center">
                <div className="relative h-24 w-24">
                    {isLogoLoading ? (
                        <Loader2 className="h-full w-full animate-spin text-primary" />
                    ) : logo ? (
                        <Image src={logo} alt="Logo" fill className="rounded-full object-cover" />
                    ) : null}
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
                onClick={handleEnterClick}
            >
            Entrer
            </Button>
        </div>

      </div>
    </div>
  );
}