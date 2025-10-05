'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Activity,
  CheckCircle,
  Rocket,
  Users,
  Shield,
  Clock,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, limit, Timestamp } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Agent, Mission } from '@/lib/types';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const agentsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'agents') : null),
    [firestore, user]
  );
  const missionsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'missions') : null),
    [firestore, user]
  );
  
  const upcomingMissionsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'missions'), where('status', 'in', ['Planification', 'En cours']), limit(5)) : null),
    [firestore, user]
  );

  const { data: agents, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);
  const { data: missions, isLoading: missionsLoading } = useCollection<Mission>(missionsQuery);
  const { data: upcomingMissions, isLoading: upcomingMissionsLoading } = useCollection<Mission>(upcomingMissionsQuery);

  const getAgentAvailability = (
    agent: Agent
  ): 'Disponible' | 'En mission' | 'En congé' => {
    if (agent.availability === 'En congé') {
      return 'En congé';
    }

    if (!missions) {
      return agent.availability as 'Disponible';
    }

    const now = Timestamp.now();
    const isOnMission = missions.some(
      (mission) =>
        mission.assignedAgentIds.includes(agent.id) &&
        mission.startDate.seconds <= now.seconds &&
        mission.endDate.seconds >= now.seconds &&
        (mission.status === 'En cours' || mission.status === 'Planification')
    );

    return isOnMission ? 'En mission' : 'Disponible';
  };

  const totalAgents = agents?.length ?? 0;
  const activeMissions =
    missions?.filter((m) => m.status === 'En cours').length ?? 0;
  const completedMissions =
    missions?.filter((m) => m.status === 'Terminée').length ?? 0;
    
  const agentsOnMission = agents?.filter(a => getAgentAvailability(a) === 'En mission').length ?? 0;


  const getAgentById = (id: string) => agents?.find(a => a.id === id);


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agents au total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentsLoading ? '...' : totalAgents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missions actives</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{missionsLoading ? '...' : activeMissions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Missions terminées
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{missionsLoading ? '...' : completedMissions}</div>
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
            <div className="text-2xl font-bold">{agentsLoading || missionsLoading ? '...' : agentsOnMission}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aperçu des missions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mission</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Agents</TableHead>
                <TableHead>Date de début</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingMissionsLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Chargement...</TableCell>
                </TableRow>
              )}
              {upcomingMissions?.map((mission) => (
                <TableRow key={mission.id}>
                  <TableCell className="font-medium">{mission.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        mission.status === 'En cours'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {mission.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {mission.assignedAgentIds.map((agentId) => {
                        const agent = getAgentById(agentId);
                        if (!agent) return null;
                        return (
                          <Avatar
                            key={agent.id}
                            className="border-2 border-background"
                          >
                            <AvatarImage src={agent.avatarUrl} />
                            <AvatarFallback>
                              {agent.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )
                      })}
                      {mission.assignedAgentIds.length === 0 && (
                        <span className="text-sm text-muted-foreground">
                          Non assigné
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {mission.startDate.toDate().toLocaleDateString('fr-FR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
