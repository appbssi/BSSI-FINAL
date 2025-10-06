'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, ImagePlus } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useRole, clearRole } from '@/hooks/use-role';
import { useLogo } from '@/context/logo-context';
import { useToast } from '@/hooks/use-toast';

export function UserNav() {
  const { user } = useUser();
  const { role } = useRole();
  const auth = useAuth();
  const router = useRouter();
  const { setLogo } = useLogo();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut(auth);
    clearRole();
    router.push('/login');
  };
  
  const handleLogoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        if (file.size > 1 * 1024 * 1024) { // 1MB limit
            toast({
                variant: 'destructive',
                title: 'Fichier trop volumineux',
                description: 'Veuillez choisir une image de moins de 1Mo.',
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            setLogo(base64);
            toast({
                title: 'Logo mis à jour',
                description: 'Le nouveau logo a été enregistré.',
            });
        };
        reader.readAsDataURL(file);
    };
    input.click();
  };

  const capitalizedRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : '';


  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted">
                <User className="h-5 w-5" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{capitalizedRole}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.isAnonymous ? 'Session locale' : user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
             <DropdownMenuItem onSelect={handleLogoUpload}>
                <ImagePlus className="mr-2 h-4 w-4" />
                <span>Changer le logo</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Se déconnecter
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
