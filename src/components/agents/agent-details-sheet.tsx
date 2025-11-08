
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { Agent, Availability } from '@/lib/types';
import { User } from 'lucide-react';

interface AgentDetailsProps {
  agent: Agent & { availability: Availability };
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AgentDetailsSheet({ agent, isOpen, onOpenChange }: AgentDetailsProps) {
  const getBadgeVariant = (availability: Availability) => {
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Détails de l'agent</DialogTitle>
          <DialogDescription>
            Informations complètes sur l'agent.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-6">
            <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                    <User className="h-8 w-8" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">{agent.fullName}</h2>
                     <p className="text-muted-foreground">{agent.registrationNumber}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-6 text-sm">
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Grade</span>
                    <p className="font-semibold">{agent.rank}</p>
                </div>
                 <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Section</span>
                    <p className="font-semibold">{agent.section || 'Non assigné'}</p>
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
      </DialogContent>
    </Dialog>
  );
}
