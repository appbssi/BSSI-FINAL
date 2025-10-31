
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
  const router = useRouter();
  const { logo, isLogoLoading } = useLogo();
  const { user, isUserLoading } = useUser();
  const isMounted = useIsMounted();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prevImage) => (prevImage + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleEnterClick = () => {
    if (user) {
      // If user is logged in, force navigation to login page
      router.push('/login?force=true');
    } else {
      // If user is not logged in, just go to login
      router.push('/login');
    }
  };
  
  if (!isMounted || isUserLoading) {
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
            onClick={handleEnterClick}
        >
          Entrer
        </Button>
      </div>
    </div>
  );
}
