'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { Agent } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { writeBatch, collection, doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

type AgentImportData = Omit<Agent, 'id' | 'availability'>;

export function ImportAgentsDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [agentsToImport, setAgentsToImport] = useState<AgentImportData[]>([]);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, {
            header: ["name", "matricule", "grade", "contact", "address"]
        }) as any[];

        // Skip header row if it exists
        if(
            json[0].name === "name" &&
            json[0].matricule === "matricule"
        ){
            json.shift();
        }

        const parsedAgents: AgentImportData[] = json.map((row) => ({
            name: String(row.name || ''),
            matricule: String(row.matricule || ''),
            grade: String(row.grade || ''),
            contact: String(row.contact || ''),
            address: String(row.address || ''),
        })).filter(agent => agent.name && agent.matricule); // Basic validation

        if(parsedAgents.length === 0){
            toast({
                variant: 'destructive',
                title: 'Fichier invalide',
                description: 'Le fichier ne contient aucun agent valide ou les colonnes ne sont pas correctes. Attendu: name, matricule, grade, contact, address',
            });
            return;
        }

        setAgentsToImport(parsedAgents);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        toast({
            variant: 'destructive',
            title: 'Erreur de lecture',
            description: 'Impossible de lire le fichier Excel. Assurez-vous qu\'il est au bon format.',
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!firestore || agentsToImport.length === 0) return;
    
    setIsImporting(true);
    try {
        const batch = writeBatch(firestore);
        const agentsCollection = collection(firestore, 'agents');

        agentsToImport.forEach(agentData => {
            const newAgentRef = doc(agentsCollection);
            const newAgent: Omit<Agent, 'id'> = {
                ...agentData,
                availability: 'Disponible',
            };
            batch.set(newAgentRef, newAgent);
        });

        await batch.commit();

        toast({
            title: 'Importation réussie !',
            description: `${agentsToImport.length} agents ont été importés avec succès.`,
        });
        setAgentsToImport([]);
        setIsOpen(false);
    } catch (error) {
        console.error("Error importing agents:", error);
        toast({
            variant: 'destructive',
            title: 'Erreur d\'importation',
            description: 'Une erreur s\'est produite lors de l\'ajout des agents à la base de données.',
        });
    } finally {
        setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importer des agents depuis Excel</DialogTitle>
          <DialogDescription>
            Sélectionnez un fichier .xlsx ou .csv. Assurez-vous que le fichier a les colonnes : name, matricule, grade, contact, address.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <Input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />

            {agentsToImport.length > 0 && (
                <div className="max-h-96 overflow-y-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Matricule</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Adresse</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {agentsToImport.map((agent, index) => (
                                <TableRow key={index}>
                                    <TableCell>{agent.name}</TableCell>
                                    <TableCell>{agent.matricule}</TableCell>
                                    <TableCell>{agent.grade}</TableCell>
                                    <TableCell>{agent.contact}</TableCell>
                                    <TableCell>{agent.address}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
          <Button onClick={handleImport} disabled={agentsToImport.length === 0 || isImporting}>
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Importer {agentsToImport.length > 0 ? `(${agentsToImport.length} agents)` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
