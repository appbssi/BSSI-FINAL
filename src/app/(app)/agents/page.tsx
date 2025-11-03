
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { RegisterAgentForm } from '@/components/agents/register-agent-form';
import type { Agent, Mission, Availability } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, deleteDoc, doc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, errorEmitter } from '@/firebase';
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AgentDetailsSheet } from '@/components/agents/agent-details-sheet';
import { useRole } from '@/hooks/use-role';
import { useLogo } from '@/context/logo-context';
import { getAgentAvailability } from '@/lib/agents';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { logActivity } from '@/lib/activity-logger';
import { FirestorePermissionError } from '@/firebase/errors';


export default function AgentsPage() {
  const firestore = useFirestore();
  const { isObserver } = useRole();
  const { logo } = useLogo();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterOpen, setRegisterOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'Disponible' | 'En mission' | 'En congé'>('all');
  const { toast } = useToast();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const agentsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'agents') : null), [firestore]);
  const missionsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'missions') : null), [firestore]);

  const { data: agents, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);
  const { data: missions, isLoading: missionsLoading } = useCollection<Mission>(missionsQuery);

  const agentsWithAvailability: Agent[] = useMemo(() => {
    if (!agents || !missions) return [];
    return agents.map(agent => ({
      ...agent,
      availability: getAgentAvailability(agent, missions)
    }));
  }, [agents, missions, now]);

  const sortedAgents = useMemo(() => {
    return [...agentsWithAvailability].sort((a, b) => {
      const firstNameComparison = a.firstName.localeCompare(b.firstName);
      if (firstNameComparison !== 0) return firstNameComparison;
      return a.lastName.localeCompare(b.lastName);
    });
  }, [agentsWithAvailability]);

  const filteredAgents = sortedAgents.filter(agent => {
    const matchesSearch = `${agent.firstName} ${agent.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = availabilityFilter === 'all' || agent.availability === availabilityFilter;
    return matchesSearch && matchesFilter;
  });

  const getBadgeVariant = (availability?: Availability) => {
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

  const handleDeleteAgent = async () => {
    if (!firestore || !agentToDelete || !missions) return;

    const availability = getAgentAvailability(agentToDelete, missions);
    if (availability === 'En mission') {
        toast({
            variant: 'destructive',
            title: 'Action non autorisée',
            description: "Vous ne pouvez pas supprimer un agent qui est actuellement en mission.",
        });
        setAgentToDelete(null);
        return;
    }

    setIsDeleting(true);

    const agentRef = doc(firestore, 'agents', agentToDelete.id);
    deleteDoc(agentRef).then(() => {
        toast({
          title: 'Agent supprimé',
          description: `L'agent ${agentToDelete.firstName} ${agentToDelete.lastName} a été supprimé.`,
        });
        logActivity(firestore, `L'agent ${agentToDelete.firstName} ${agentToDelete.lastName} a été supprimé.`, 'Agent', '/agents');
    }).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: agentRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    }).finally(() => {
        setIsDeleting(false);
        setAgentToDelete(null); // Close the dialog
    });
  };

  const handleDeduplicate = async () => {
    if (!firestore) return;
    setIsDeleting(true);
    try {
      const deletedCount = await deleteDuplicateAgents(firestore);
      toast({
        title: deletedCount > 0 ? 'Doublons supprimés' : 'Aucun doublon trouvé',
        description: deletedCount > 0 ? `${deletedCount} agent(s) en double ont été supprimé(s).` : "Votre liste d'agents ne contient aucun doublon.",
      });
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
    const tableTitle = "Liste des Agents";
    const generationDate = new Date().toLocaleDateString('fr-FR');
    const pageWidth = doc.internal.pageSize.getWidth();

    const addContent = (logoImg: HTMLImageElement | null) => {
        let currentY = 15;

        if (logoImg) {
            const aspectRatio = logoImg.width / logoImg.height;
            const logoWidth = 30;
            const logoHeight = logoWidth / aspectRatio;
            doc.addImage(logoImg, 'PNG', (pageWidth - logoWidth) / 2, currentY, logoWidth, logoHeight);
            currentY += logoHeight + 5;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("BRIGADE SPECIALE DE SURVEILLANCE ET D'INTERVENTION", pageWidth / 2, currentY, { align: 'center' });
        currentY += 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text("Duralex - Sed Lex", pageWidth / 2, currentY, { align: 'center' });
        currentY += 15;

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(tableTitle, 14, currentY);
        currentY += 7;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Généré le: ${generationDate}`, 14, currentY);
        currentY += 8;

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
            startY: currentY,
            theme: 'striped',
            headStyles: { fillColor: [39, 55, 70], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            didDrawPage: (data) => {
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(10);
                doc.text(`Page ${data.pageNumber} sur ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });
        doc.save('liste_agents.pdf');
    };

    if (logo) {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => addContent(img);
        img.onerror = () => {
            console.error("Erreur de chargement du logo pour le PDF.");
            addContent(null);
        };
        img.src = logo;
    } else {
        addContent(null);
    }
  };


  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
      </div>
      
       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 space-y-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Rechercher par nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
           <div className="flex items-center gap-2 flex-wrap md:pt-0">
            <Button size="sm" variant={availabilityFilter === 'all' ? 'default' : 'outline'} onClick={() => setAvailabilityFilter('all')}>Tous</Button>
            <Button size="sm" variant={availabilityFilter === 'Disponible' ? 'default' : 'outline'} onClick={() => setAvailabilityFilter('Disponible')}>Disponibles</Button>
            <Button size="sm" variant={availabilityFilter === 'En mission' ? 'default' : 'outline'} onClick={() => setAvailabilityFilter('En mission')}>En mission</Button>
            <Button size="sm" variant={availabilityFilter === 'En congé' ? 'default' : 'outline'} onClick={() => setAvailabilityFilter('En congé')}>En congé</Button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
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

          {!isObserver && (
            <>
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                <span className="sr-only">Supprimer les doublons</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Supprimer les doublons</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                          <AlertDialogDescription>Cette action va rechercher tous les agents avec le même matricule et supprimer les doublons. Cette action est irréversible.</AlertDialogDescription>
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
              <Dialog open={isRegisterOpen} onOpenChange={setRegisterOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Enregistrer
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <RegisterAgentForm onAgentRegistered={() => setRegisterOpen(false)} />
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Disponibilité</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agentsLoading || missionsLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Chargement des agents...</TableCell></TableRow>
            ) : filteredAgents.length > 0 ? (
              filteredAgents.map((agent) => {
                const isAgentOnMission = agent.availability === 'En mission';
                return (
                  <TableRow key={agent.id} onClick={() => setSelectedAgent(agent)} className="cursor-pointer">
                    <TableCell>
                      <div className="font-medium">{agent.firstName} {agent.lastName}</div>
                      <div className="text-sm text-muted-foreground">{agent.registrationNumber}</div>
                    </TableCell>
                    <TableCell>{agent.rank}</TableCell>
                    <TableCell>{agent.contact}</TableCell>
                    <TableCell><Badge variant={getBadgeVariant(agent.availability)}>{agent.availability}</Badge></TableCell>
                    <TableCell>
                      {!isObserver && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => setEditingAgent(agent)}>Modifier</DropdownMenuItem>
                            <DropdownMenuItem 
                              onSelect={() => !isAgentOnMission && setAgentToDelete(agent)}
                              disabled={isAgentOnMission}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Aucun agent trouvé.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editingAgent && (
        <Dialog open={!!editingAgent} onOpenChange={(open) => !open && setEditingAgent(null)}>
          <DialogContent>
            <EditAgentSheet
              agent={editingAgent}
              availability={editingAgent.availability!}
              onAgentEdited={() => setEditingAgent(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {selectedAgent && missions && (
        <AgentDetailsSheet
          agent={{...selectedAgent, availability: getAgentAvailability(selectedAgent, missions)}}
          isOpen={!!selectedAgent}
          onOpenChange={(open) => !open && setSelectedAgent(null)}
        />
      )}

      {agentToDelete && (
        <AlertDialog open={!!agentToDelete} onOpenChange={(open) => !open && setAgentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous absolument sûr?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. L'agent <span className="font-semibold">{`${agentToDelete.firstName} ${agentToDelete.lastName}`}</span> sera définitivement supprimé.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setAgentToDelete(null)}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAgent} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
                 {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
