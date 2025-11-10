
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { Agent, Availability, Mission } from '@/lib/types';
import { User, Shield, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { getDisplayStatus } from '@/lib/missions';

interface AgentDetailsProps {
  agent: Agent & { availability: Availability };
  missions: Mission[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AgentDetailsSheet({ agent, missions, isOpen, onOpenChange }: AgentDetailsProps) {
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

  const sortedMissions = [...missions].sort((a, b) => b.startDate.toMillis() - a.startDate.toMillis());

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md bg-background/80 backdrop-blur-md shadow-2xl border-white/30">
        <DialogHeader>
          <DialogTitle>Détails de l'agent</DialogTitle>
          <DialogDescription>
            Informations complètes et historique des missions de l'agent.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground">Grade</span>
                        <p className="font-semibold">{agent.rank}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground">Section</span>
                        <p className="font-semibold">{agent.section === 'OFFICIER' ? 'N/A' : (agent.section || 'Non assigné').toUpperCase()}</p>
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
                 <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <span className="text-muted-foreground">Disponibilité</span>
                        <div>
                            <Badge variant={getBadgeVariant(agent.availability)}>
                                {agent.availability}
                            </Badge>
                        </div>
                    </div>
                     <div className="flex flex-col gap-2">
                        <span className="text-muted-foreground">Total Missions</span>
                        <div className="flex items-center gap-1 font-bold text-lg">
                           <Shield className="h-5 w-5" />
                           <span>{agent.missionCount || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-2 pt-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground"/>
                    Historique des Missions
                </h3>
                <div className="border rounded-lg max-h-[7rem] overflow-hidden">
                    <ScrollArea className="h-[7rem]">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mission</TableHead>
                                    <TableHead>Dates</TableHead>
                                    <TableHead>Statut</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedMissions.length > 0 ? (
                                    sortedMissions.map(mission => (
                                        <TableRow key={mission.id}>
                                            <TableCell>
                                                <div className="font-medium">{mission.name}</div>
                                                <div className="text-xs text-muted-foreground">{mission.location}</div>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {mission.startDate.toDate().toLocaleDateString('fr-FR')} - {mission.endDate.toDate().toLocaleDateString('fr-FR')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getDisplayStatus(mission) === 'Terminée' ? 'outline' : getDisplayStatus(mission) === 'Annulée' ? 'destructive' : 'secondary'}>
                                                    {getDisplayStatus(mission)}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            Aucune mission assignée.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
