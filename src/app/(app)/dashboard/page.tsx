import { agents, missions } from '@/lib/data';
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
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const totalAgents = agents.length;
  const activeMissions = missions.filter(
    (m) => m.status === 'En cours'
  ).length;
  const completedMissions = missions.filter(
    (m) => m.status === 'Terminée'
  ).length;
  const agentsOnMission = agents.filter(
    (a) => a.availability === 'En mission'
  ).length;

  const upcomingMissions = missions
    .filter((m) => m.status === 'Planification' || m.status === 'En cours')
    .slice(0, 5);

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
            <div className="text-2xl font-bold">{totalAgents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missions actives</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMissions}</div>
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
            <div className="text-2xl font-bold">{completedMissions}</div>
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
            <div className="text-2xl font-bold">{agentsOnMission}</div>
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
              {upcomingMissions.map((mission) => (
                <TableRow key={mission.id}>
                  <TableCell className="font-medium">{mission.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        mission.status === 'En cours'
                          ? 'default'
                          : 'secondary'
                      }
                      className={
                        mission.status === 'En cours'
                          ? 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30'
                          : ''
                      }
                    >
                      {mission.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {mission.assignedAgents.map((agent) => (
                        <Avatar
                          key={agent.id}
                          className="border-2 border-background"
                        >
                          <AvatarImage src={agent.avatarUrl} />
                          <AvatarFallback>
                            {agent.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {mission.assignedAgents.length === 0 && (
                        <span className="text-sm text-muted-foreground">
                          Non assigné
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {mission.startDate.toLocaleDateString('fr-FR')}
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
