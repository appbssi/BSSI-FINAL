
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
import { MoreHorizontal, PlusCircle, Users, Search, FileDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CreateMissionForm } from '@/components/missions/create-mission-form';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Agent, Mission } from '@/lib/types';
import { useState, useMemo } from 'react';
import { EditMissionSheet } from '@/components/missions/edit-mission-sheet';
import { deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
} from "@/components/ui/alert-dialog";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const AssignedAgentsDialog = ({ agents, missionName }: { agents: Agent[], missionName: string }) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    const filteredAgents = agents.filter(agent => 
        `${agent.firstName} ${agent.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const mainTitle = `Mission: ${missionName}`;
        const subTitle = "Agents en Mission";
        const generationDate = new Date().toLocaleDateString('fr-FR');
        const pageWidth = doc.internal.pageSize.getWidth();

        // Official Header
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("BRIGADE SPECIALE DE SURVEILLANCE ET D'INTERVENTION", pageWidth / 2, 15, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text("Duralex - Sed Lex", pageWidth / 2, 20, { align: 'center' });
        
        // Report Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(mainTitle, pageWidth / 2, 35, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(subTitle, pageWidth / 2, 42, { align: 'center' });
        doc.setFontSize(11);
        doc.text(`Généré le: ${generationDate}`, 14, 50);

        autoTable(doc, {
            head: [['Prénom', 'Nom', 'Grade', 'Contact']],
            body: filteredAgents.map(agent => [
                agent.firstName,
                agent.lastName,
                agent.rank,
                agent.contact,
            ]),
            startY: 60,
            theme: 'striped',
            headStyles: {
                fillColor: [39, 55, 70],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            didDrawPage: (data) => {
                // Footer
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(10);
                doc.text(`Page ${data.pageNumber} sur ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });
        doc.save(`agents_assignes_${missionName.replace(/ /g, '_')}.pdf`);
    };

    const handleExportXLSX = () => {
        const dataToExport = filteredAgents.map(agent => ({
            'Prénom': agent.firstName,
            'Nom': agent.lastName,
            'Grade': agent.rank,
            'Contact': agent.contact,
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Agents Assignés');
        XLSX.writeFile(workbook, `agents_assignes_${missionName.replace(/ /g, '_')}.xlsx`);
    };


    return (
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>AGENT A LA MISSION "{missionName.toUpperCase()}"</DialogTitle>
                <DialogDescription>
                    Liste des agents assignés à cette mission.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un agent..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
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
                </div>
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom Complet</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Contact</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAgents.length > 0 ? (
                                filteredAgents.map(agent => (
                                    <TableRow key={agent.id}>
                                        <TableCell className="font-medium">{agent.firstName} {agent.lastName}</TableCell>
                                        <TableCell>{agent.rank}</TableCell>
                                        <TableCell>{agent.contact}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">Aucun agent trouvé.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </DialogContent>
    )
}

export default function MissionsPage() {
  const [isCreateMissionOpen, setCreateMissionOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [missionToCancel, setMissionToCancel] = useState<Mission | null>(null);
  const [missionToDelete, setMissionToDelete] = useState<Mission | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Planification' | 'En cours' | 'Terminée' | 'Annulée'>('all');
  
  const missionsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'missions') : null),
    [firestore, user]
  );
  
  const agentsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'agents') : null),
    [firestore, user]
  );

  const { data: missions, isLoading: missionsLoading } = useCollection<Mission>(missionsQuery);
  const { data: agents, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);
  
  const agentsById = useMemo(() => {
    if (!agents) return {};
    return agents.reduce((acc, agent) => {
        acc[agent.id] = agent;
        return acc;
    }, {} as Record<string, Agent>);
  }, [agents]);

  const sortedMissions = useMemo(() => {
    if (!missions) return [];
    
    const statusOrder: Record<Mission['status'], number> = {
      'En cours': 1,
      'Planification': 2,
      'Terminée': 3,
      'Annulée': 4,
    };

    return [...missions].sort((a, b) => {
      const orderA = statusOrder[a.status] || 5;
      const orderB = statusOrder[b.status] || 5;

      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // If statuses are the same, sort by start date (most recent first)
      return b.startDate.toMillis() - a.startDate.toMillis();
    });
  }, [missions]);

  const filteredMissions = useMemo(() => {
    return sortedMissions.filter(mission => {
      const matchesSearch = mission.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = statusFilter === 'all' || mission.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [sortedMissions, searchQuery, statusFilter]);


  const getBadgeVariant = (
    status: 'Planification' | 'En cours' | 'Terminée' | 'Annulée'
  ) => {
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
  
  const handleCancelMission = () => {
    if (!firestore || !missionToCancel) return;
    const missionRef = doc(firestore, 'missions', missionToCancel.id);
    updateDocumentNonBlocking(missionRef, { status: 'Annulée' });
    toast({
        title: 'Mission annulée',
        description: `La mission "${missionToCancel.name}" a été annulée.`
    });
    setMissionToCancel(null);
  }

  const handleDeleteMission = () => {
    if (!firestore || !missionToDelete) return;
    const missionRef = doc(firestore, 'missions', missionToDelete.id);
    deleteDocumentNonBlocking(missionRef);
    toast({
      title: 'Mission supprimée',
      description: `La mission "${missionToDelete.name}" a été supprimée.`,
    });
    setMissionToDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Missions</h1>
        <Dialog open={isCreateMissionOpen} onOpenChange={setCreateMissionOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Créer une mission
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
             <DialogHeader>
                <DialogTitle>Créer une nouvelle mission</DialogTitle>
             </DialogHeader>
            <CreateMissionForm onMissionCreated={() => setCreateMissionOpen(false)}/>
          </DialogContent>
        </Dialog>
      </div>

       <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une mission..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
             <div className="flex items-center gap-2">
                <Button size="sm" variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')}>Toutes</Button>
                <Button size="sm" variant={statusFilter === 'Planification' ? 'default' : 'outline'} onClick={() => setStatusFilter('Planification')}>Planifiées</Button>
                <Button size="sm" variant={statusFilter === 'En cours' ? 'default' : 'outline'} onClick={() => setStatusFilter('En cours')}>En cours</Button>
                <Button size="sm" variant={statusFilter === 'Terminée' ? 'default' : 'outline'} onClick={() => setStatusFilter('Terminée')}>Terminées</Button>
                <Button size="sm" variant={statusFilter === 'Annulée' ? 'default' : 'outline'} onClick={() => setStatusFilter('Annulée')}>Annulées</Button>
            </div>
          </div>
        </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mission</TableHead>
              <TableHead>Lieu</TableHead>
              <TableHead>Date de début</TableHead>
              <TableHead>Agents Assignés</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {missionsLoading || agentsLoading ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">Chargement des missions...</TableCell>
                </TableRow>
            ) : (
            filteredMissions.map((mission) => {
              const assignedAgents = (mission.assignedAgentIds || [])
                .map(id => agentsById[id])
                .filter(Boolean)
                .sort((a, b) => a.firstName.localeCompare(b.firstName) || a.lastName.localeCompare(b.lastName));

              return (
              <TableRow key={mission.id}>
                <TableCell className="font-medium">{mission.name}</TableCell>
                <TableCell>{mission.location}</TableCell>
                <TableCell>{mission.startDate.toDate().toLocaleDateString('fr-FR')}</TableCell>
                <TableCell>
                   <div className="flex items-center gap-2">
                    {assignedAgents && assignedAgents.length > 0 ? (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-2 px-2">
                                    <Users className="h-4 w-4" />
                                    <span className="font-medium">{assignedAgents.length}</span>
                                </Button>
                            </DialogTrigger>
                            <AssignedAgentsDialog agents={assignedAgents} missionName={mission.name} />
                        </Dialog>
                    ) : (
                      <span className="text-sm text-muted-foreground">Non assigné</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getBadgeVariant(mission.status)}
                  >
                    {mission.status}
                  </Badge>
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
                      <DropdownMenuItem onSelect={() => setEditingMission(mission)}>Prolonger</DropdownMenuItem>
                      {mission.status !== 'Annulée' && mission.status !== 'Terminée' && (
                        <DropdownMenuItem 
                            onSelect={() => setMissionToCancel(mission)}
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                            Annuler la mission
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setMissionToDelete(mission)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )})
            )}
             {!missionsLoading && filteredMissions.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Aucune mission trouvée.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editingMission && (
        <EditMissionSheet
          mission={editingMission}
          isOpen={!!editingMission}
          onOpenChange={(open) => {
            if (!open) {
              setEditingMission(null);
            }
          }}
        />
      )}

      {missionToCancel && (
         <AlertDialog open={!!missionToCancel} onOpenChange={(open) => !open && setMissionToCancel(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr de vouloir annuler cette mission ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. La mission <span className="font-semibold">{missionToCancel.name}</span> sera marquée comme "Annulée".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setMissionToCancel(null)}>Retour</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelMission} className="bg-destructive hover:bg-destructive/90">
                Annuler la mission
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {missionToDelete && (
        <AlertDialog open={!!missionToDelete} onOpenChange={(open) => !open && setMissionToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous absolument sûr?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. La mission{' '}
                <span className="font-semibold">{missionToDelete.name}</span> sera définitivement supprimée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setMissionToDelete(null)}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteMission} className="bg-destructive hover:bg-destructive/90">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}

    

    
