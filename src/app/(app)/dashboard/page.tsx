
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users,
  Shield,
  UserCheck,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import type { Agent, Mission } from '@/lib/types';
import { useMemo, useState } from 'react';
import { getAgentAvailability } from '@/lib/agents';
import { MissionDetailsDialog } from '@/components/missions/mission-details-dialog';
import { isSameDay } from 'date-fns';

type MissionStatus = 'Planification' | 'En cours' | 'Terminée' | 'Annulée';

export default function DashboardPage() {
  const firestore = useFirestore();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  const agentsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'agents') : null),
    [firestore]
  );
  
  const missionsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'missions') : null),
    [firestore]
  );

  const { data: agents, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);
  const { data: missions, isLoading: missionsLoading } = useCollection<Mission>(missionsQuery);

  const agentsById = useMemo(() => {
    if (!agents) return {};
    return agents.reduce((acc, agent) => {
        acc[agent.id] = agent;
        return acc;
    }, {} as Record<string, Agent>);
  }, [agents]);

  const agentsWithAvailability = useMemo(() => {
    if (!agents || !missions) return [];
    return agents.map(agent => ({
      ...agent,
      availability: getAgentAvailability(agent, missions)
    }));
  }, [agents, missions]);


  const activeMissions = useMemo(() => {
    if (!missions) return [];
    return missions.filter(mission => {
        return mission.status === 'En cours';
    }).slice(0, 5);
}, [missions]);


  const totalAgents = agents?.length ?? 0;
  const agentsOnMission = agentsWithAvailability?.filter(a => a.availability === 'En mission').length ?? 0;
  const availableAgents = agentsWithAvailability?.filter(a => a.availability === 'Disponible').length ?? 0;

  const isLoading = agentsLoading || missionsLoading;

  const getBadgeVariant = (status: MissionStatus) => {
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
  
    const getDisplayStatus = (mission: Mission): MissionStatus => {
        const now = new Date();
        const startDate = mission.startDate.toDate();
        const endDate = mission.endDate.toDate();

        if (mission.status === 'Annulée') {
            return 'Annulée';
        }

        if (isSameDay(startDate, endDate) && mission.startTime && mission.endTime) {
            const [startHours, startMinutes] = mission.startTime.split(':').map(Number);
            const [endHours, endMinutes] = mission.endTime.split(':').map(Number);
            const fullStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), startHours, startMinutes);
            const fullEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), endHours, endMinutes);

            if (now > fullEndDate) return 'Terminée';
            if (now < fullStartDate) return 'Planification';
            return 'En cours';
        }
        
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const missionEndDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        if (today > missionEndDay) {
            return 'Terminée';
        }
        if (today < startDate) {
            return 'Planification';
        }
        
        return 'En cours';
    };

  return (
    <>
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agents au total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : totalAgents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agents disponibles</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : availableAgents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Agents en mission
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : agentsOnMission}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Aperçu des missions en cours ({isLoading ? '...' : activeMissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mission</TableHead>
                  <TableHead>Lieu</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date de fin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">Chargement...</TableCell>
                  </TableRow>
                )}
                {!isLoading && activeMissions.map((mission) => {
                   const displayStatus = getDisplayStatus(mission);
                  return(
                    <TableRow key={mission.id} onClick={() => setSelectedMission(mission)} className="cursor-pointer">
                      <TableCell className="font-medium">{mission.name}</TableCell>
                      <TableCell>{mission.location}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(displayStatus)}>{displayStatus}</Badge>
                      </TableCell>
                      <TableCell>
                        {mission.endDate.toDate().toLocaleDateString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {!isLoading && activeMissions.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Aucune mission en cours.
                      </TableCell>
                  </TableRow>
              )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      {selectedMission && (
        <MissionDetailsDialog
            isOpen={!!selectedMission}
            onOpenChange={(open) => {
                if (!open) {
                    setSelectedMission(null);
                }
            }}
            mission={selectedMission}
            agents={
                selectedMission.assignedAgentIds
                .map(id => agentsById[id])
                .filter(Boolean) as Agent[]
            }
        />
      )}
    </>
  );
}

    