
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
import { useLogo } from '@/context/logo-context';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';

interface SettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function SettingsSheet({ isOpen, onOpenChange }: SettingsSheetProps) {
  const { logo, setLogo } = useLogo();
  const { toast } = useToast();

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit
        toast({
            variant: 'destructive',
            title: 'Fichier trop volumineux',
            description: 'Veuillez choisir une image de moins de 1 Mo.',
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setLogo(result);
        toast({
          title: 'Logo mis à jour !',
          description: 'Votre nouveau logo a été appliqué.',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Paramètres</SheetTitle>
          <SheetDescription>
            Gérez les paramètres de votre application ici.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
            <div className="space-y-2">
                <Label htmlFor="logo-upload">Logo de l'application</Label>
                <div className='flex items-center gap-4'>
                    <div className="relative h-16 w-16 rounded-md border flex items-center justify-center bg-muted">
                        {logo && <Image src={logo} alt="Current logo" fill className="rounded-md object-cover" />}
                    </div>
                    <Input id="logo-upload" type="file" accept="image/png, image/jpeg, image/gif, image/svg+xml" onChange={handleLogoUpload} className="w-full" />
                </div>
                 <p className="text-xs text-muted-foreground">
                    Pour de meilleurs résultats, utilisez une image carrée. Taille max: 1Mo.
                </p>
            </div>

            <Button variant="outline" onClick={() => setLogo(null)}>
                Réinitialiser le logo
            </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
