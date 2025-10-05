
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
import { useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Agent, Mission } from '@/lib/types';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const agentsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'agents') : null),
    [firestore, user]
  );
  
  const activeMissionsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'missions'), where('status', '==', 'En cours'), limit(5)) : null),
    [firestore, user]
  );

   const missionsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'missions') : null),
    [firestore, user]
  );

  const { data: agents, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);
  const { data: missions, isLoading: missionsLoading } = useCollection<Mission>(missionsQuery);
  const { data: activeMissions, isLoading: activeMissionsLoading } = useCollection<Mission>(activeMissionsQuery);

  const totalAgents = agents?.length ?? 0;
  const activeMissionsCount =
    missions?.filter((m) => m.status === 'En cours').length ?? 0;
    
  const agentsOnMission = agents?.filter(a => a.availability === 'En mission').length ?? 0;
  const availableAgents = agents?.filter(a => a.availability === 'Disponible').length ?? 0;

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
          <CardTitle>Aperçu des missions</CardTitle>
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
              {activeMissions?.map((mission) => (
                <TableRow key={mission.id}>
                  <TableCell className="font-medium">{mission.name}</TableCell>
                   <TableCell>{mission.location}</TableCell>
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
                    {mission.startDate.toDate().toLocaleDateString('fr-FR')}
                  </TableCell>
                </TableRow>
              ))}
               {!activeMissionsLoading && activeMissions?.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Aucune mission active.
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
