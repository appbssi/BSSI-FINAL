
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
import { useFirestore, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, writeBatch, getDocs } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import * as z from 'zod';

type AgentImportData = Omit<Agent, 'id' | 'onLeave'>;

const contactSchema = z.string().length(10, 'Le contact doit contenir exactement 10 chiffres.').regex(/^[0-9]+$/, 'Le contact ne doit contenir que des chiffres.');

export function ImportAgentsDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [agentsToImport, setAgentsToImport] = useState<AgentImportData[]>([]);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !firestore) return;

    setAgentsToImport([]); 

    // Fetch existing agents to check for duplicates
    const agentsRef = collection(firestore, 'agents');
    const querySnapshot = await getDocs(agentsRef);
    const existingAgents = querySnapshot.docs.map(doc => doc.data() as Omit<Agent, 'id'>);
    const existingRegNumbers = new Set(existingAgents.map(a => a.registrationNumber));
    const existingContacts = new Set(existingAgents.map(a => a.contact));

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const json = XLSX.utils.sheet_to_json(worksheet, {
            header: ["firstName", "lastName", "registrationNumber", "rank", "contact", "address"],
            range: 1 // Skip the header row
        }) as any[];


        const seenInFileReg = new Set<string>();
        const seenInFileContact = new Set<string>();
        let duplicatesInFile = 0;
        let duplicatesInDb = 0;
        let invalidContacts = 0;

        const parsedAgents: AgentImportData[] = json.map((row) => ({
            firstName: String(row.firstName || '').trim(),
            lastName: String(row.lastName || '').trim(),
            registrationNumber: String(row.registrationNumber || '').trim(),
            rank: String(row.rank || '').trim(),
            contact: String(row.contact || '').trim(),
            address: String(row.address || '').trim(),
        })).filter(agent => {
            if (!agent.firstName || !agent.lastName || !agent.registrationNumber || !agent.contact) {
                return false;
            }

            // Validate contact format
            const contactValidation = contactSchema.safeParse(agent.contact);
            if (!contactValidation.success) {
                invalidContacts++;
                return false;
            }

            // Check for duplicates in DB
            if (existingRegNumbers.has(agent.registrationNumber) || existingContacts.has(agent.contact)) {
                duplicatesInDb++;
                return false;
            }
            // Check for duplicates within the file
            if (seenInFileReg.has(agent.registrationNumber) || seenInFileContact.has(agent.contact)) {
                duplicatesInFile++;
                return false;
            }
            seenInFileReg.add(agent.registrationNumber);
            seenInFileContact.add(agent.contact);
            return true;
        });

        if (duplicatesInDb > 0 || duplicatesInFile > 0 || invalidContacts > 0) {
            let messages = [];
            if (duplicatesInDb > 0) messages.push(`${duplicatesInDb} agent(s) existant(s) déjà dans la base de données ont été ignoré(s).`);
            if (duplicatesInFile > 0) messages.push(`${duplicatesInFile} doublon(s) dans le fichier ont été ignoré(s).`);
            if (invalidContacts > 0) messages.push(`${invalidContacts} agent(s) avec un format de contact invalide ont été ignoré(s).`);
            
            toast({
                title: 'Données ignorées',
                description: messages.join(' '),
            });
        }

        if(parsedAgents.length === 0){
            if(duplicatesInDb === 0 && duplicatesInFile === 0 && invalidContacts === 0) {
              toast({
                  variant: 'destructive',
                  title: 'Fichier invalide ou vide',
                  description: "Le fichier ne contient aucun agent valide ou les colonnes ne sont pas correctes. Attendu: firstName, lastName, registrationNumber, rank, contact, address",
              });
            }
            return;
        }

        setAgentsToImport(parsedAgents);
      } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erreur de lecture',
            description: "Impossible de lire le fichier Excel. Assurez-vous qu'il est au bon format.",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!firestore || agentsToImport.length === 0) return;
    
    setIsImporting(true);
    const batch = writeBatch(firestore);
    const allData = [];

    agentsToImport.forEach(agentData => {
        const newAgentRef = doc(collection(firestore, 'agents'));
        const newAgent: Omit<Agent, 'id'> = {
            ...agentData,
            onLeave: false,
        };
        batch.set(newAgentRef, newAgent);
        allData.push(newAgent);
    });

    batch.commit().then(() => {
        toast({
            title: 'Importation réussie !',
            description: `${agentsToImport.length} agents ont été importés avec succès.`,
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'agents/[batch]',
            operation: 'create',
            requestResourceData: allData,
        });
        errorEmitter.emit('permission-error', permissionError);
    }).finally(() => {
        setIsImporting(false);
        setAgentsToImport([]);
        setIsOpen(false);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if(!open) {
            setAgentsToImport([]);
        }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importer des agents depuis Excel</DialogTitle>
          <DialogDescription>
            Sélectionnez un fichier .xlsx ou .csv. Assurez-vous que le fichier a les colonnes : firstName, lastName, registrationNumber, rank, contact, address. La première ligne sera ignorée.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <Input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />

            {agentsToImport.length > 0 && (
                <div className="max-h-96 overflow-y-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Prénom</TableHead>
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
                                    <TableCell>{agent.firstName}</TableCell>
                                    <TableCell>{agent.lastName}</TableCell>
                                    <TableCell>{agent.registrationNumber}</TableCell>
                                    <TableCell>{agent.rank}</TableCell>
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
          <Button variant="outline" onClick={() => { setIsOpen(false); setAgentsToImport([]); }}>Annuler</Button>
          <Button onClick={handleImport} disabled={agentsToImport.length === 0 || isImporting}>
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Importer {agentsToImport.length > 0 ? `(${agentsToImport.length} agents)` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
