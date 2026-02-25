
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
import { User, Shield, Calendar, Phone, MapPin, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { getDisplayStatus } from '@/lib/missions';
import Image from 'next/image';

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
      <DialogContent className="rounded-[2rem] sm:max-w-md bg-background/95 backdrop-blur-md shadow-2xl border-primary/50 border-2 max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Détails de l'agent</DialogTitle>
          <DialogDescription>
            Informations complètes et historique des missions.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6">
          <div className="pb-8 space-y-8">
              {/* En-tête de profil */}
              <div className="flex flex-col items-center text-center gap-4 pt-2">
                  <div className="h-32 w-32 rounded-full border-4 border-primary/10 overflow-hidden flex items-center justify-center bg-muted text-muted-foreground shadow-xl">
                      {agent.photo ? (
                        <Image 
                          src={agent.photo} 
                          alt={agent.fullName} 
                          width={128} 
                          height={128} 
                          className="object-cover h-full w-full" 
                        />
                      ) : (
                        <User className="h-16 w-16" />
                      )}
                  </div>
                  <div>
                      <h2 className="text-2xl font-bold tracking-tight">{agent.fullName}</h2>
                       <Badge variant="secondary" className="font-mono mt-1 text-[1.1em]">
                         {agent.registrationNumber || 'Sans matricule'}
                       </Badge>
                  </div>
              </div>

              {/* Statistiques rapides */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-xl text-center space-y-1">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Statut</span>
                  <div className="flex justify-center">
                    <Badge variant={getBadgeVariant(agent.availability)}>
                        {agent.availability}
                    </Badge>
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl text-center space-y-1">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Missions</span>
                  <div className="flex items-center justify-center gap-2 font-bold text-lg">
                     <Shield className="h-5 w-5 text-primary" />
                     <span>{agent.missionCount || 0}</span>
                  </div>
                </div>
              </div>

              {/* Détails personnels */}
              <div className="space-y-4">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">Informations Générales</h3>
                  <div className="bg-card border rounded-xl divide-y overflow-hidden">
                      <div className="flex items-center gap-4 p-3">
                          <div className="bg-primary/10 p-2 rounded-lg">
                            <Briefcase className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Grade & Section</p>
                            <p className="text-sm font-semibold">{agent.rank} • {agent.section === 'OFFICIER' ? 'OFFICIER' : (agent.section || 'Non assigné').toUpperCase()}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-4 p-3">
                          <div className="bg-primary/10 p-2 rounded-lg">
                            <Phone className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Contact</p>
                            <p className="text-sm font-semibold">{agent.contact || 'Non renseigné'}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-4 p-3">
                          <div className="bg-primary/10 p-2 rounded-lg">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Adresse</p>
                            <p className="text-sm font-semibold">{agent.address}</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Historique des missions */}
              <div className="space-y-4">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">Historique des Missions</h3>
                  <div className="border rounded-xl overflow-hidden bg-card">
                       <Table>
                          <TableHeader className="bg-muted/50">
                              <TableRow>
                                  <TableHead className="h-10">Mission</TableHead>
                                  <TableHead className="h-10">Date</TableHead>
                                  <TableHead className="h-10 text-right">Statut</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {sortedMissions.length > 0 ? (
                                  sortedMissions.map(mission => (
                                      <TableRow key={mission.id}>
                                          <TableCell className="py-3">
                                              <div className="font-medium text-xs leading-none">{mission.name}</div>
                                              <div className="text-[10px] text-muted-foreground mt-1">{mission.location}</div>
                                          </TableCell>
                                          <TableCell className="py-3 text-[10px] whitespace-nowrap">
                                              {mission.startDate.toDate().toLocaleDateString('fr-FR')}
                                          </TableCell>
                                          <TableCell className="py-3 text-right">
                                              <Badge className="text-[10px] h-5 px-1.5" variant={getDisplayStatus(mission) === 'Terminée' ? 'outline' : getDisplayStatus(mission) === 'Annulée' ? 'destructive' : 'secondary'}>
                                                  {getDisplayStatus(mission)}
                                              </Badge>
                                          </TableCell>
                                      </TableRow>
                                  ))
                              ) : (
                                  <TableRow>
                                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground text-xs italic">
                                          Aucune mission assignée pour le moment.
                                      </TableCell>
                                  </TableRow>
                              )}
                          </TableBody>
                      </Table>
                  </div>
              </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
