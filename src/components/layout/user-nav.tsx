
'use client';

import { useState } from 'react';
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
import { User } from 'lucide-react';
import { SettingsSheet } from '@/components/settings/settings-sheet';

export function UserNav() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
              <p className="text-sm font-medium leading-none">Admin</p>
              <p className="text-xs leading-none text-muted-foreground">
                admin@e-brigade.com
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setIsSettingsOpen(true)}>
              Paramètres
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Se déconnecter</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SettingsSheet isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  );
}
