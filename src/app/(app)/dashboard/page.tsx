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
import { useMemo, useState, useEffect } from 'react';
import { getAgentAvailability } from '@/lib/agents';
import { MissionDetailsDialog } from '@/components/missions/mission-details-dialog';
import { getDisplayStatus, MissionWithDisplayStatus } from '@/lib/missions';

export default function DashboardPage() {
  const firestore = useFirestore();
  const [selectedMission, setSelectedMission] = useState<MissionWithDisplayStatus | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const agentsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'agents') : null), [firestore]);
  const missionsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'missions') : null), [firestore]);

  const { data: agents, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);
  const { data: missions, isLoading: missionsLoading } = useCollection<Mission>(missionsQuery);

  const agentsById = useMemo(() => {
    if (!agents) return {};
    return agents.reduce((acc, agent) => {
        acc[agent.id] = agent;
        return acc;
    }, {} as Record<string, Agent>);
  }, [agents]);

  const missionsWithDisplayStatus: MissionWithDisplayStatus[] = useMemo(() => {
    if (!missions) return [];
    return missions.map(mission => ({
      ...mission,
      displayStatus: getDisplayStatus(mission),
    }));
  }, [missions, now]);

  const agentsWithAvailability = useMemo(() => {
    if (!agents || !missions) return [];
    return agents.map(agent => ({
      ...agent,
      availability: getAgentAvailability(agent, missions)
    }));
  }, [agents, missions, now]);


  const activeMissions = useMemo(() => {
    return missionsWithDisplayStatus.filter(mission => mission.displayStatus === 'En cours').slice(0, 5);
  }, [missionsWithDisplayStatus]);


  const totalAgents = agents?.length ?? 0;
  const agentsOnMission = agentsWithAvailability?.filter(a => a.availability === 'En mission').length ?? 0;
  const availableAgents = agentsWithAvailability?.filter(a => a.availability === 'Disponible').length ?? 0;

  const isLoading = agentsLoading || missionsLoading;

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
              <CardTitle className="text-sm font-medium">Agents en mission</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : agentsOnMission}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Aperçu des missions en cours ({isLoading ? '...' : activeMissions.length})</CardTitle>
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
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center">Chargement...</TableCell></TableRow>
                ) : activeMissions.length > 0 ? (
                  activeMissions.map((mission) => (
                    <TableRow key={mission.id} onClick={() => setSelectedMission(mission)} className="cursor-pointer">
                      <TableCell className="font-medium">{mission.name}</TableCell>
                      <TableCell>{mission.location}</TableCell>
                      <TableCell><Badge variant={getBadgeVariant(mission.displayStatus)}>{mission.displayStatus}</Badge></TableCell>
                      <TableCell>{mission.endDate.toDate().toLocaleDateString('fr-FR')}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Aucune mission en cours.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      {selectedMission && (
        <MissionDetailsDialog
            isOpen={!!selectedMission}
            onOpenChange={(open) => !open && setSelectedMission(null)}
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
