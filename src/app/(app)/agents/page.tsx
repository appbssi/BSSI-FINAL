
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
import { FileUp, MoreHorizontal, PlusCircle, Search, Trash2, Loader2, FileDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { RegisterAgentSheet } from '@/components/agents/register-agent-sheet';
import type { Agent } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { ImportAgentsDialog } from '@/components/agents/import-agents-dialog';
import { Input } from '@/components/ui/input';
import { EditAgentSheet } from '@/components/agents/edit-agent-sheet';
import { deleteDuplicateAgents } from '@/lib/firestore-utils';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AgentDetailsSheet } from '@/components/agents/agent-details-sheet';


export default function AgentsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'Disponible' | 'En mission' | 'En congé'>('all');
  const { toast } = useToast();

  const agentsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'agents') : null),
    [firestore, user]
  );

  const { data: agents, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);

  const sortedAgents = agents
    ? [...agents].sort((a, b) => {
        const firstNameComparison = a.firstName.localeCompare(b.firstName);
        if (firstNameComparison !== 0) {
          return firstNameComparison;
        }
        return a.lastName.localeCompare(b.lastName);
      })
    : [];

  const filteredAgents = sortedAgents.filter(agent => {
    const matchesSearch = `${agent.firstName} ${agent.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = availabilityFilter === 'all' || agent.availability === availabilityFilter;
    return matchesSearch && matchesFilter;
  });

  const getBadgeVariant = (availability: string) => {
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

  const handleDeleteAgent = () => {
    if (!firestore || !agentToDelete) return;

    const agentRef = doc(firestore, 'agents', agentToDelete.id);
    deleteDocumentNonBlocking(agentRef);
    
    toast({
      title: 'Agent supprimé',
      description: `L'agent ${agentToDelete.firstName} ${agentToDelete.lastName} a été supprimé.`,
    });

    setAgentToDelete(null); // Close the dialog
  };

  const handleDeduplicate = async () => {
    if (!firestore) return;
    setIsDeleting(true);
    try {
      const deletedCount = await deleteDuplicateAgents(firestore);
      if (deletedCount > 0) {
        toast({
          title: 'Doublons supprimés',
          description: `${deletedCount} agent(s) en double ont été supprimé(s).`,
        });
      } else {
        toast({
          title: 'Aucun doublon trouvé',
          description: "Votre liste d'agents ne contient aucun doublon.",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la suppression des doublons: ", error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression des doublons.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportXLSX = () => {
    const dataToExport = filteredAgents.map(agent => ({
        'Prénom': agent.firstName,
        'Nom': agent.lastName,
        'Matricule': agent.registrationNumber,
        'Grade': agent.rank,
        'Contact': agent.contact,
        'Disponibilité': agent.availability,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Agents');
    XLSX.writeFile(workbook, 'liste_agents.xlsx');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Liste des Agents', 14, 16);
    autoTable(doc, {
        head: [['Prénom', 'Nom', 'Matricule', 'Grade', 'Contact', 'Disponibilité']],
        body: filteredAgents.map(agent => [
            agent.firstName,
            agent.lastName,
            agent.registrationNumber,
            agent.rank,
            agent.contact,
            agent.availability,
        ]),
        startY: 20,
    });
    doc.save('liste_agents.pdf');
  };


  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
      </div>
      
      <div className="flex items-center justify-between gap-4">
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
           <div className="flex items-center gap-2">
            <Button size="sm" variant={availabilityFilter === 'all' ? 'default' : 'outline'} onClick={() => setAvailabilityFilter('all')}>Tous</Button>
            <Button size="sm" variant={availabilityFilter === 'Disponible' ? 'default' : 'outline'} onClick={() => setAvailabilityFilter('Disponible')}>Disponibles</Button>
            <Button size="sm" variant={availabilityFilter === 'En mission' ? 'default' : 'outline'} onClick={() => setAvailabilityFilter('En mission')}>En mission</Button>
            <Button size="sm" variant={availabilityFilter === 'En congé' ? 'default' : 'outline'} onClick={() => setAvailabilityFilter('En congé')}>En congé</Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FileDown className="mr-2 h-4 w-4" /> Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Choisir un format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleExportPDF}>Exporter en PDF</DropdownMenuItem>
                <DropdownMenuItem onSelect={handleExportXLSX}>Exporter en XLSX</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          <AlertDialog>
              <AlertDialogTrigger asChild>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" disabled={isDeleting}>
                            {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                            <span className="sr-only">Supprimer les doublons</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Supprimer les doublons</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                      <AlertDialogDescription>
                          Cette action va rechercher tous les agents avec le même matricule et supprimer les doublons. Cette action est irréversible.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeduplicate}>Continuer</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
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
            {agentsLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Chargement des agents...</TableCell>
              </TableRow>
            ) : (
              filteredAgents.map((agent) => {
                const fullName = `${agent.firstName} ${agent.lastName}`;
                return (
                  <TableRow key={agent.id} onClick={() => setSelectedAgent(agent)} className="cursor-pointer">
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
                      <Badge variant={getBadgeVariant(agent.availability)}>
                        {agent.availability}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => setEditingAgent(agent)}>Modifier</DropdownMenuItem>
                          <DropdownMenuItem 
                            onSelect={() => setAgentToDelete(agent)}
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            {!agentsLoading && filteredAgents.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Aucun agent trouvé.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editingAgent && (
        <EditAgentSheet
          agent={editingAgent}
          isOpen={!!editingAgent}
          onOpenChange={(open) => {
            if (!open) {
              setEditingAgent(null);
            }
          }}
        />
      )}

      {selectedAgent && (
        <AgentDetailsSheet
          agent={selectedAgent}
          isOpen={!!selectedAgent}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedAgent(null);
            }
          }}
        />
      )}

      {agentToDelete && (
        <AlertDialog open={!!agentToDelete} onOpenChange={(open) => !open && setAgentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous absolument sûr?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. L'agent{' '}
                <span className="font-semibold">{`${agentToDelete.firstName} ${agentToDelete.lastName}`}</span> sera définitivement supprimé.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setAgentToDelete(null)}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAgent} className="bg-destructive hover:bg-destructive/90">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );

    