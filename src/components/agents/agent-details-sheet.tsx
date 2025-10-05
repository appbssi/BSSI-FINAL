
'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import type { Agent } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';

interface AgentDetailsSheetProps {
  agent: Agent;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AgentDetailsSheet({ agent, isOpen, onOpenChange }: AgentDetailsSheetProps) {
  const getBadgeVariant = (availability: string) => {
    switch (availability) {
      case 'Disponible':
        return 'outline';
      case 'En mission':
        return 'default';
      case 'En congé':
        return 'destructive';
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
                <div className="h-16 w-16 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                    <User className="h-8 w-8" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">{agent.lastName} {agent.firstName}</h2>
                     <p className="text-muted-foreground">{agent.registrationNumber}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-6 text-sm">
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Grade</span>
                    <p className="font-semibold">{agent.rank}</p>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-muted-foreground">Disponibilité actuelle</span>
                    <div>
                        <Badge variant={getBadgeVariant(agent.availability)}>
                            {agent.availability}
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
