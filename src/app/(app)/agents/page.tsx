
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
import { FileUp, MoreHorizontal, PlusCircle, Search, FileDown, Shield, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RegisterAgentForm } from '@/components/agents/register-agent-form';
import type { Agent, Availability, Mission } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, deleteDoc, doc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, errorEmitter } from '@/firebase';
import { ImportAgentsDialog } from '@/components/agents/import-agents-dialog';
import { Input } from '@/components/ui/input';
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
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { ManageLeaveDialog } from '@/components/agents/manage-leave-dialog';
import { EditAgentSheet } from '@/components/agents/edit-agent-sheet';
import { updateOfficerRanks, prefixContactsWithZero } from '@/lib/firestore-utils';


export default function AgentsPage() {
  const firestore = useFirestore();
  const { isObserver, isAdmin } = useRole();
  const { logo } = useLogo();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterOpen, setRegisterOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [leaveAgent, setLeaveAgent] = useState<Agent | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingRanks, setIsUpdatingRanks] = useState(false);
  const [isUpdatingContacts, setIsUpdatingContacts] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'Disponible' | 'En mission' | 'En congé'>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
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

  const agentsWithDetails: Agent[] = useMemo(() => {
    if (!agents || !missions) return [];
    return agents.map(agent => ({
      ...agent,
      availability: getAgentAvailability(agent, missions),
      missionCount: missions.filter(m => m.assignedAgentIds.includes(agent.id)).length,
    }));
  }, [agents, missions, now]);

  const sortedAgents = useMemo(() => {
    if (!agentsWithDetails) return [];
    return [...agentsWithDetails].sort((a, b) => {
      const nameA = a.fullName || '';
      const nameB = b.fullName || '';
      return nameA.localeCompare(nameB);
    });
}, [agentsWithDetails]);

  const filteredAgents = sortedAgents.filter(agent => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (agent.fullName || '').toLowerCase().includes(searchLower) ||
                          (agent.registrationNumber || '').toLowerCase().includes(searchLower) ||
                          (agent.rank || '').toLowerCase().includes(searchLower);
    const matchesAvailability = availabilityFilter === 'all' || agent.availability === availabilityFilter;
    
    let matchesSection;
    if (sectionFilter === 'all') {
        matchesSection = true;
    } else if (sectionFilter === 'Non assigné') {
        matchesSection = !agent.section || agent.section === 'Non assigné';
    } else {
        matchesSection = (agent.section || '').toLowerCase() === sectionFilter.toLowerCase();
    }
    
    return matchesSearch && matchesAvailability && matchesSection;
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
          description: `L'agent ${agentToDelete.fullName} a été supprimé.`,
        });
        logActivity(firestore, `L'agent ${agentToDelete.fullName} a été supprimé.`, 'Agent', '/agents');
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

  const handleUpdateRanks = async () => {
    if (!firestore) return;
    setIsUpdatingRanks(true);
    try {
        const updatedCount = await updateOfficerRanks(firestore);
        if (updatedCount > 0) {
            toast({
                title: "Mise à jour réussie",
                description: `${updatedCount} grade(s) d'officier(s) ont été mis à jour.`
            });
        } else {
            toast({
                title: "Aucune mise à jour",
                description: "Aucun agent ne correspondait aux critères de mise à jour."
            });
        }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erreur de mise à jour",
            description: error.message || "Une erreur est survenue lors de la mise à jour des grades.",
        });
    } finally {
        setIsUpdatingRanks(false);
    }
  };

  const handleUpdateContacts = async () => {
    if (!firestore) return;
    setIsUpdatingContacts(true);
    try {
        const updatedCount = await prefixContactsWithZero(firestore);
        if (updatedCount > 0) {
            toast({
                title: "Mise à jour des contacts réussie",
                description: `${updatedCount} contact(s) ont été mis à jour.`
            });
        } else {
            toast({
                title: "Aucune mise à jour de contact",
                description: "Aucun contact ne nécessitait de mise à jour."
            });
        }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erreur de mise à jour des contacts",
            description: error.message || "Une erreur est survenue lors de la mise à jour des contacts.",
        });
    } finally {
        setIsUpdatingContacts(false);
    }
  };


  const handleExportXLSX = () => {
    const dataToExport = filteredAgents.map(agent => ({
        'Nom complet': agent.fullName,
        'Matricule': agent.registrationNumber,
        'Grade': agent.rank,
        'Contact': agent.contact,
        'Section': agent.section || 'Non assigné',
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
            head: [['Nom complet', 'Matricule', 'Grade', 'Section', 'Disponibilité']],
            body: filteredAgents.map(agent => [
                agent.fullName,
                agent.registrationNumber,
                agent.rank,
                agent.section === 'OFFICIER' ? 'N/A' : (agent.section || 'Non assigné').toUpperCase(),
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
      <div className="flex items-baseline gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
        <span className="text-muted-foreground">({filteredAgents.length} affiché(s))</span>
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Rechercher par nom, matricule ou grade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {!isObserver && (
                <Dialog open={isRegisterOpen} onOpenChange={setRegisterOpen}>
                  <DialogTrigger asChild>
                    <button className="button-13 flex items-center justify-center text-primary">
                      <PlusCircle className="mr-2 h-4 w-4" /> Enregistrer
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <RegisterAgentForm onAgentRegistered={() => setRegisterOpen(false)} />
                  </DialogContent>
                </Dialog>
              )}
               {!isObserver && (
                  <ImportAgentsDialog>
                    <button className="button-13 flex items-center justify-center text-primary">
                      <FileUp className="mr-2 h-4 w-4" /> Importer
                    </button>
                  </ImportAgentsDialog>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="button-13 flex items-center justify-center text-primary">
                    <FileDown className="mr-2 h-4 w-4" /> Exporter
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Choisir un format</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleExportPDF}>Exporter en PDF</DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleExportXLSX}>Exporter en XLSX</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">Filtrer par:</span>
            <button className={cn('button-13', availabilityFilter === 'all' && 'active')} onClick={() => setAvailabilityFilter('all')}>Tous</button>
            <button className={cn('button-13', availabilityFilter === 'Disponible' && 'active')} onClick={() => setAvailabilityFilter('Disponible')}>Disponibles</button>
            <button className={cn('button-13', availabilityFilter === 'En mission' && 'active')} onClick={() => setAvailabilityFilter('En mission')}>En mission</button>
            <button className={cn('button-13', availabilityFilter === 'En congé' && 'active')} onClick={() => setAvailabilityFilter('En congé')}>En congé</button>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="button-13 !w-[180px]">
                <SelectValue placeholder="Filtrer par section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">TOUTES LES SECTIONS</SelectItem>
                <SelectItem value="Armurerie">ARMURERIE</SelectItem>
                <SelectItem value="Administration">ADMINISTRATION</SelectItem>
                <SelectItem value="FAUNE">FAUNE</SelectItem>
                <SelectItem value="CONDUCTEUR">CONDUCTEUR</SelectItem>
                <SelectItem value="SECTION FEMININE">SECTION FEMININE</SelectItem>
                <SelectItem value="DETACHEMENT NOE">DETACHEMENT NOE</SelectItem>
                <SelectItem value="DETACHEMENT TINGRELA">DETACHEMENT TINGRELA</SelectItem>
                <SelectItem value="DETACHEMENT MORONDO">DETACHEMENT MORONDO</SelectItem>
                <SelectItem value="Non assigné">NON ASSIGNÉ</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom complet</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Missions</TableHead>
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
                    <TableCell className="font-medium">
                        <div>{agent.fullName}</div>
                        {agent.registrationNumber && <div className="text-xs text-muted-foreground">{agent.registrationNumber}</div>}
                    </TableCell>
                    <TableCell>{agent.rank}</TableCell>
                     <TableCell>
                      <div className="flex items-center justify-center gap-1 font-semibold">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {agent.missionCount || 0}
                      </div>
                    </TableCell>
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
                              onSelect={() => setLeaveAgent(agent)}
                              disabled={isAgentOnMission}
                            >
                              Gérer le congé
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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

      {leaveAgent && (
        <ManageLeaveDialog
          agent={leaveAgent}
          isOpen={!!leaveAgent}
          onOpenChange={(open) => !open && setLeaveAgent(null)}
        />
      )}

      {selectedAgent && missions && (
        <AgentDetailsSheet
          agent={{...selectedAgent, availability: getAgentAvailability(selectedAgent, missions), missionCount: missions.filter(m => m.assignedAgentIds.includes(selectedAgent.id)).length}}
          missions={missions.filter(m => m.assignedAgentIds.includes(selectedAgent.id))}
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
                Cette action est irréversible. L'agent <span className="font-semibold">{agentToDelete.fullName}</span> sera définitivement supprimé.
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

    

    