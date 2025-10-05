'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { RegisterAgentSheet } from '@/components/agents/register-agent-sheet';
import type { Agent, Mission } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, Timestamp } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';

export default function AgentsPage() {
  const firestore = useFirestore();
  const agentsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'agents') : null),
    [firestore]
  );
  const missionsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'missions') : null),
    [firestore]
  );
  const { data: agents } = useCollection<Agent>(agentsQuery);
  const { data: missions } = useCollection<Mission>(missionsQuery);

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
        mission.startDate <= now &&
        mission.endDate >= now &&
        (mission.status === 'En cours' || mission.status === 'Planification')
    );

    return isOnMission ? 'En mission' : 'Disponible';
  };

  const getBadgeVariant = (availability: string) => {
    switch (availability) {
      case 'Disponible':
        return 'outline';
      case 'En mission':
        return 'default';
      case 'En congé':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
        <RegisterAgentSheet>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Enregistrer un agent
          </Button>
        </RegisterAgentSheet>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Compétences</TableHead>
              <TableHead>Disponibilité</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents?.map((agent) => {
              const availability = getAgentAvailability(agent);
              return (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={agent.avatarUrl} alt={agent.name} />
                        <AvatarFallback>
                          {agent.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">
                        {agent.name}
                        <div className="text-sm text-muted-foreground">
                          {agent.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {agent.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(availability)}>
                      {availability}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Modifier</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
