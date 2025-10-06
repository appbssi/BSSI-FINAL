
'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Agent, Gathering } from '@/lib/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CreateMissionFromGatheringForm } from '../missions/create-mission-from-gathering-form';
import { Rocket } from 'lucide-react';

interface ViewAttendanceDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  gathering: Gathering;
  agentsById: Record<string, Agent>;
}

export function ViewAttendanceDialog({ isOpen, onOpenChange, gathering, agentsById }: ViewAttendanceDialogProps) {
  const [showCreateMissionForm, setShowCreateMissionForm] = useState(false);
  const [agentsForMission, setAgentsForMission] = useState<Agent[]>([]);

  const { presentAgents, absentAgents } = useMemo(() => {
    const present: Agent[] = [];
    const absent: Agent[] = [];

    gathering.assignedAgentIds.forEach(id => {
      const agent = agentsById[id];
      if (agent) {
        if (gathering.absentAgentIds.includes(id)) {
          absent.push(agent);
        } else {
          present.push(agent);
        }
      }
    });

    const sortFn = (a: Agent, b: Agent) => a.firstName.localeCompare(b.firstName) || a.lastName.localeCompare(b.lastName);
    
    return {
      presentAgents: present.sort(sortFn),
      absentAgents: absent.sort(sortFn),
    };
  }, [gathering, agentsById]);

  const handleCreateMission = (agents: Agent[]) => {
      setAgentsForMission(agents);
      setShowCreateMissionForm(true);
  };
  
  const handleBackToList = () => {
    setShowCreateMissionForm(false);
    setAgentsForMission([]);
  }

  const handleExportPDF = (listType: 'present' | 'absent' | 'all') => {
    const doc = new jsPDF();
    const mainTitle = `Rassemblement: ${gathering.name}`;
    const dateTime = gathering.dateTime.toDate().toLocaleString('fr-FR');
    
    let listTitle = '';
    let agents: Agent[] = [];

    if (listType === 'present') {
        listTitle = 'Liste des Présents';
        agents = presentAgents;
    } else if (listType === 'absent') {
        listTitle = 'Liste des Absents';
        agents = absentAgents;
    } else {
        listTitle = 'Liste de Présence Complète';
        agents = [...presentAgents, ...absentAgents].sort((a,b) => a.firstName.localeCompare(b.firstName));
    }
    
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("BRIGADE SPECIALE DE SURVEILLANCE ET D'INTERVENTION", pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(18);
    doc.text(mainTitle, pageWidth / 2, 35, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`${listTitle} - ${dateTime}`, pageWidth / 2, 42, { align: 'center' });

    const body = agents.map(agent => [
        agent.firstName,
        agent.lastName,
        agent.registrationNumber,
        agent.rank,
        listType === 'all' ? (gathering.absentAgentIds.includes(agent.id) ? 'Absent' : 'Présent') : ''
    ].filter(Boolean));

    const head = ['Prénom', 'Nom', 'Matricule', 'Grade'];
    if (listType === 'all') {
        head.push('Statut');
    }

    autoTable(doc, {
        head: [head],
        body,
        startY: 50,
        theme: 'striped',
        headStyles: { fillColor: [39, 55, 70] },
    });

    doc.save(`liste_${listType}_${gathering.name.replace(/ /g, '_')}.pdf`);
  };

  const AgentList = ({ agents, onStartMission }: { agents: Agent[], onStartMission: (agents: Agent[]) => void }) => (
     <>
        <ScrollArea className="h-72">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nom Complet</TableHead>
                        <TableHead>Matricule</TableHead>
                        <TableHead>Grade</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {agents.length > 0 ? (
                        agents.map(agent => (
                            <TableRow key={agent.id}>
                                <TableCell>{agent.firstName} {agent.lastName}</TableCell>
                                <TableCell>{agent.registrationNumber}</TableCell>
                                <TableCell>{agent.rank}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24">
                                Aucun agent dans cette liste.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </ScrollArea>
        <div className="flex justify-end mt-4">
             <Button onClick={() => onStartMission(agents)} disabled={agents.length === 0}>
                <Rocket className="mr-2 h-4 w-4" />
                Créer une mission avec ces agents
             </Button>
        </div>
     </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            setShowCreateMissionForm(false);
        }
        onOpenChange(open);
    }}>
      <DialogContent className="max-w-3xl">
        {showCreateMissionForm ? (
             <CreateMissionFromGatheringForm 
                agents={agentsForMission}
                onMissionCreated={() => {
                    setShowCreateMissionForm(false);
                    onOpenChange(false);
                }}
                onCancel={handleBackToList}
             />
        ) : (
        <>
            <DialogHeader>
                <DialogTitle>Liste de présence pour "{gathering.name}"</DialogTitle>
                <DialogDescription>
                    {gathering.dateTime.toDate().toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}
                </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="present">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="present">Présents ({presentAgents.length})</TabsTrigger>
                    <TabsTrigger value="absent">Absents ({absentAgents.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="present">
                    <AgentList agents={presentAgents} onStartMission={handleCreateMission} />
                    <div className="flex justify-end mt-4">
                        <Button variant="outline" onClick={() => handleExportPDF('present')}>Exporter la liste des présents (PDF)</Button>
                    </div>
                </TabsContent>
                <TabsContent value="absent">
                    <AgentList agents={absentAgents} onStartMission={handleCreateMission}/>
                    <div className="flex justify-end mt-4">
                        <Button variant="outline" onClick={() => handleExportPDF('absent')}>Exporter la liste des absents (PDF)</Button>
                    </div>
                </TabsContent>
            </Tabs>
            
            <DialogFooter className="sm:justify-between items-center pt-4 border-t">
                <Button onClick={() => handleExportPDF('all')}>Exporter la liste complète (PDF)</Button>
                <Button variant="secondary" onClick={() => onOpenChange(false)}>Fermer</Button>
            </DialogFooter>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
