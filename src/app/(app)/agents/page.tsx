'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FileUp, MoreHorizontal, PlusCircle, Search } from 'lucide-react';
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
import { useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { ImportAgentsDialog } from '@/components/agents/import-agents-dialog';
import { Input } from '@/components/ui/input';

export default function AgentsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');

  const agentsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'agents') : null),
    [firestore, user]
  );
  const missionsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'missions') : null),
    [firestore, user]
  );
  const { data: agents, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);
  const { data: missions, isLoading: missionsLoading } = useCollection<Mission>(missionsQuery);

  const sortedAgents = agents?.sort((a, b) => {
    const lastNameComparison = a.lastName.localeCompare(b.lastName);
    if (lastNameComparison !== 0) {
      return lastNameComparison;
    }
    return a.firstName.localeCompare(b.firstName);
  });
  
  const filteredAgents = sortedAgents?.filter(agent => 
    `${agent.firstName} ${agent.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAgentAvailability = (
    agent: Agent
  ): 'Disponible' | 'En mission' | 'En congé' => {
    if (agent.availability === 'En congé') {
      return 'En congé';
    }

    if (!missions) {
      return 'Disponible'; // Default if missions are not loaded yet
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
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
        <div className="flex flex-1 items-center gap-2">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Rechercher un agent..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
        <div className="flex items-center gap-2">
          <ImportAgentsDialog>
            <Button variant="outline">
              <FileUp className="mr-2 h-4 w-4" /> Importer
            </Button>
          </ImportAgentsDialog>
          <RegisterAgentSheet>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Enregistrer
            </Button>
          </RegisterAgentSheet>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Disponibilité</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agentsLoading || missionsLoading ? (
               <TableRow>
                  <TableCell colSpan={5} className="text-center">Chargement des agents...</TableCell>
                </TableRow>
            ) : (
            filteredAgents?.map((agent) => {
              const availability = getAgentAvailability(agent);
              const fullName = `${agent.firstName} ${agent.lastName}`;
              return (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {(agent.firstName?.[0] ?? '') + (agent.lastName?.[0] ?? '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">
                        {fullName}
                        <div className="text-sm text-muted-foreground">
                          {agent.registrationNumber}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {agent.rank}
                  </TableCell>
                  <TableCell>
                    {agent.contact}
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
            })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
