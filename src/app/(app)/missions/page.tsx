'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CreateMissionForm } from '@/components/missions/create-mission-form';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import type { Agent, Mission } from '@/lib/types';

export default function MissionsPage() {
  const firestore = useFirestore();
  const missionsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'missions') : null),
    [firestore]
  );
  const agentsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'agents') : null),
    [firestore]
  );

  const { data: missions } = useCollection<Mission>(missionsQuery);
  const { data: agents } = useCollection<Agent>(agentsQuery);

  const getBadgeVariant = (
    status: 'Planification' | 'En cours' | 'Terminée' | 'Annulée'
  ) => {
    switch (status) {
      case 'En cours':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30';
      case 'Terminée':
        return 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30';
      case 'Annulée':
        return 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30';
      case 'Planification':
      default:
        return '';
    }
  };
  
  const getAgentById = (id: string) => agents?.find(a => a.id === id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Missions</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Créer une mission
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full max-w-2xl">
            <CreateMissionForm />
          </PopoverContent>
        </Popover>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mission</TableHead>
              <TableHead>Lieu</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Agents assignés</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {missions?.map((mission) => (
              <TableRow key={mission.id}>
                <TableCell className="font-medium">{mission.name}</TableCell>
                <TableCell>{mission.location}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={getBadgeVariant(mission.status)}
                  >
                    {mission.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {mission.assignedAgentIds.map((agentId) => {
                      const agent = getAgentById(agentId);
                      if(!agent) return null;
                      return (
                      <Avatar
                        key={agent.id}
                        className="border-2 border-background"
                      >
                        <AvatarImage src={agent.avatarUrl} alt={agent.name} />
                        <AvatarFallback>
                          {agent.name.substring(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                    )})}
                    {mission.assignedAgentIds.length === 0 && (
                      <span className="text-sm text-muted-foreground">
                        Non assigné
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>Modifier</DropdownMenuItem>
                      <DropdownMenuItem>Voir les détails</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                        Annuler la mission
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
