'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useRole, clearRole } from '@/hooks/use-role';
import { Avatar, AvatarFallback } from '../ui/avatar';

export function UserNav() {
  const { user } = useUser();
  const { role } = useRole();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    clearRole();
    router.push('/login?force=true');
  };
  
  const capitalizedRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : '';
  const roleInitial = role ? role.charAt(0).toUpperCase() : '?';


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-9 w-9">
              <AvatarFallback>{roleInitial}</AvatarFallback>
          </Avatar>
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
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Se déconnecter
          </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
