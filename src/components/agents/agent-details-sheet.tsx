
'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Agent } from '@/lib/types';

interface AgentDetailsSheetProps {
  agent: Agent;
  availability: 'Disponible' | 'En mission';
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AgentDetailsSheet({ agent, availability, isOpen, onOpenChange }: AgentDetailsSheetProps) {
  const getBadgeVariant = (availability: string) => {
    switch (availability) {
      case 'Disponible':
        return 'outline';
      case 'En mission':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Détails de l'agent</SheetTitle>
          <SheetDescription>
            Informations complètes sur l'agent.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-6">
            <div className="flex items-center gap-4">
                 <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-2xl">
                        {(agent.firstName?.[0] ?? '') + (agent.lastName?.[0] ?? '')}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-2xl font-bold">{agent.firstName} {agent.lastName}</h2>
                     <p className="text-muted-foreground">{agent.registrationNumber}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Grade</span>
                    <p className="font-semibold">{agent.rank}</p>
                </div>
                 <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Disponibilité</span>
                    <div>
                        <Badge variant={getBadgeVariant(availability)}>
                            {availability}
                        </Badge>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Contact</span>
                    <p className="font-semibold">{agent.contact}</p>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Adresse</span>
                    <p className="font-semibold">{agent.address}</p>
                </div>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
