
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
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

interface AgentDetailsSheetProps {
  agent: Agent;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AgentDetailsSheet({ agent, isOpen, onOpenChange }: AgentDetailsSheetProps) {
    const firestore = useFirestore();
    const { toast } = useToast();

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

  const handleAvailabilityChange = (newAvailability: Agent['availability']) => {
    if(!firestore) return;
    const agentRef = doc(firestore, 'agents', agent.id);
    updateDocumentNonBlocking(agentRef, { availability: newAvailability });
    toast({
        title: 'Disponibilité mise à jour',
        description: `Le statut de ${agent.firstName} ${agent.lastName} est maintenant: ${newAvailability}`
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Détails de l'agent</SheetTitle>
          <SheetDescription>
            Informations complètes sur l'agent et gestion de sa disponibilité.
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
                <div className="flex flex-col gap-3">
                    <Label className="text-muted-foreground">Modifier la disponibilité</Label>
                    <RadioGroup 
                        defaultValue={agent.availability} 
                        onValueChange={handleAvailabilityChange}
                        className="flex items-center gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Disponible" id="r-disponible" />
                            <Label htmlFor="r-disponible">Disponible</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="En mission" id="r-mission" />
                            <Label htmlFor="r-mission">En mission</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="En congé" id="r-conge" />
                            <Label htmlFor="r-conge">En congé</Label>
                        </div>
                    </RadioGroup>
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
