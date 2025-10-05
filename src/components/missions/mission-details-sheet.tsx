
'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import type { Agent, Mission } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface MissionDetailsSheetProps {
  mission: Mission;
  agents: Agent[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function MissionDetailsSheet({ mission, agents, isOpen, onOpenChange }: MissionDetailsSheetProps) {
  
  const getBadgeVariant = (status: Mission['status']) => {
    switch (status) {
      case 'En cours':
        return 'default';
      case 'Terminée':
        return 'outline';
      case 'Annulée':
        return 'destructive';
      case 'Planification':
      default:
        return 'secondary';
    }
  };

  const assignedAgents = (mission.assignedAgentIds || [])
    .map(id => agents.find(agent => agent.id === id))
    .filter((agent): agent is Agent => !!agent);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Détails de la Mission</SheetTitle>
          <SheetDescription>
            Informations complètes sur la mission.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-6">
            <h2 className="text-2xl font-bold">{mission.name}</h2>
            
            <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Lieu</span>
                    <p className="font-semibold">{mission.location}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground">Date de début</span>
                        <p className="font-semibold">{format(mission.startDate.toDate(), "PPP", { locale: fr })}</p>
                    </div>
                     <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground">Date de fin</span>
                        <p className="font-semibold">{format(mission.endDate.toDate(), "PPP", { locale: fr })}</p>
                    </div>
                </div>
                 <div className="flex flex-col gap-2">
                    <span className="text-muted-foreground">Statut</span>
                    <div>
                        <Badge variant={getBadgeVariant(mission.status)}>
                            {mission.status}
                        </Badge>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Agents Assignés ({assignedAgents.length})</h3>
                <div className="border rounded-lg">
                    <ScrollArea className="h-64">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Grade</TableHead>
                                    <TableHead>Contact</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignedAgents.length > 0 ? (
                                    assignedAgents.map(agent => (
                                        <TableRow key={agent.id}>
                                            <TableCell className="font-medium">{agent.firstName} {agent.lastName}</TableCell>
                                            <TableCell>{agent.rank}</TableCell>
                                            <TableCell>{agent.contact}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                            Aucun agent n'est assigné à cette mission.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
