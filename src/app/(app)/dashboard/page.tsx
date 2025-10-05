
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Activity,
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
import { collection, query, where, limit } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import type { Agent, Mission } from '@/lib/types';
import { useMemo } from 'react';

export default function DashboardPage() {
  const firestore = useFirestore();

  const agentsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'agents') : null),
    [firestore]
  );
  
  const potentiallyActiveMissionsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'missions'), where('status', 'in', ['En cours', 'Planification']), limit(10)) : null),
    [firestore]
  );

   const missionsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'missions') : null),
    [firestore]
  );

  const { data: agents, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);
  const { data: allMissions, isLoading: missionsLoading } = useCollection<Mission>(missionsQuery);
  const { data: potentiallyActiveMissions, isLoading: activeMissionsLoading } = useCollection<Mission>(potentiallyActiveMissionsQuery);

  const activeMissions = useMemo(() => {
    if (!potentiallyActiveMissions) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return potentiallyActiveMissions.filter(mission => {
        if (mission.status === 'En cours') return true;
        if (mission.status === 'Planification' && mission.startDate.toDate() <= today) return true;
        return false;
    }).slice(0, 5);
  }, [potentiallyActiveMissions]);


  const totalAgents = agents?.length ?? 0;
  const activeMissionsCount =
    allMissions?.filter((m) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return m.status === 'En cours' || (m.status === 'Planification' && m.startDate.toDate() <= today)
    }).length ?? 0;
    
  const agentsOnMission = agents?.filter(a => a.availability === 'En mission').length ?? 0;
  const availableAgents = agents?.filter(a => a.availability === 'Disponible').length ?? 0;

  return (
    <div className="space-y-8">
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
            <CardTitle className="text-sm font-medium">Agents disponibles</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentsLoading ? '...' : availableAgents}</div>
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
            <div className="text-2xl font-bold">{agentsLoading ? '...' : agentsOnMission}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missions actives</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{missionsLoading ? '...' : activeMissionsCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aperçu des missions en cours</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mission</TableHead>
                 <TableHead>Lieu</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date de début</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeMissionsLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Chargement...</TableCell>
                </TableRow>
              )}
              {!activeMissionsLoading && activeMissions.map((mission) => (
                <TableRow key={mission.id}>
                  <TableCell className="font-medium">{mission.name}</TableCell>
                   <TableCell>{mission.location}</TableCell>
                  <TableCell>
                    <Badge
                      variant='default'
                    >
                      En cours
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {mission.startDate.toDate().toLocaleDateString('fr-FR')}
                  </TableCell>
                </TableRow>
              ))}
               {!activeMissionsLoading && activeMissions.length === 0 && (
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
  );
}
