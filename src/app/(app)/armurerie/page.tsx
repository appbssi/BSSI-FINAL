
'use client';

import { useState, useMemo } from 'react';
import { ClientOnly } from '@/components/layout/client-only';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  PlusCircle, 
  Search, 
  Sword, 
  UserPlus, 
  History, 
  AlertTriangle, 
  ArrowLeftRight,
  FileText,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, doc, updateDoc, Timestamp, addDoc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import type { Weapon, WeaponAssignment, Agent, Mission } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AddWeaponForm } from '@/components/armurerie/add-weapon-form';
import { AssignWeaponForm } from '@/components/armurerie/assign-weapon-form';
import { logActivity } from '@/lib/activity-logger';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLogo } from '@/context/logo-context';
import { cn } from '@/lib/utils';

export default function ArmureriePage() {
  return (
    <ClientOnly>
      <ArmurerieContent />
    </ClientOnly>
  );
}

function ArmurerieContent() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { logo } = useLogo();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddWeaponOpen, setAddWeaponOpen] = useState(false);
  const [isAssignOpen, setAssignOpen] = useState(false);

  const weaponsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'weapons') : null), [firestore]);
  const assignmentsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'weaponAssignments'), orderBy('assignedAt', 'desc')) : null), [firestore]);
  const agentsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'agents') : null), [firestore]);
  const missionsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'missions') : null), [firestore]);

  const { data: weapons, isLoading: weaponsLoading } = useCollection<Weapon>(weaponsQuery);
  const { data: assignments, isLoading: assignmentsLoading } = useCollection<WeaponAssignment>(assignmentsQuery);
  const { data: agents } = useCollection<Agent>(agentsQuery);
  const { data: missions } = useCollection<Mission>(missionsQuery);

  const agentsById = useMemo(() => {
    if (!agents) return {};
    return agents.reduce((acc, agent) => { acc[agent.id] = agent; return acc; }, {} as Record<string, Agent>);
  }, [agents]);

  const weaponsById = useMemo(() => {
    if (!weapons) return {};
    return weapons.reduce((acc, weapon) => { acc[weapon.id] = weapon; return acc; }, {} as Record<string, Weapon>);
  }, [weapons]);

  const filteredWeapons = useMemo(() => {
    if (!weapons) return [];
    return weapons.filter(w => 
      w.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.model.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [weapons, searchQuery]);

  const handleReturnWeapon = async (assignment: WeaponAssignment) => {
    if (!firestore) return;
    try {
      const assignmentRef = doc(firestore, 'weaponAssignments', assignment.id);
      await updateDoc(assignmentRef, { returnedAt: Timestamp.now() });
      
      const weapon = weaponsById[assignment.weaponId];
      const agent = agentsById[assignment.agentId];
      
      logActivity(firestore, `Retour de matériel : ${weapon?.model} par ${agent?.fullName}`, 'Armurerie', '/armurerie');
      toast({ title: 'Retour enregistré', description: 'Le matériel a été marqué comme retourné.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'enregistrer le retour." });
    }
  };

  const handleReportIssue = async (weapon: Weapon) => {
    if (!firestore) return;
    const newStatus = weapon.status === 'En maintenance' ? 'Fonctionnel' : 'En maintenance';
    try {
      const weaponRef = doc(firestore, 'weapons', weapon.id);
      await updateDoc(weaponRef, { 
        status: newStatus,
        lastMaintenanceDate: Timestamp.now()
      });
      toast({ title: 'Statut mis à jour', description: `L'équipement est maintenant marqué comme : ${newStatus}` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de mettre à jour le statut." });
    }
  };

  const generateDailyReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = new Date().toLocaleDateString('fr-FR');

    const addHeader = () => {
      doc.setFontSize(10);
      doc.text("BRIGADE SPECIALE DE SURVEILLANCE ET D'INTERVENTION", pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(16);
      doc.text("RAPPORT QUOTIDIEN ARMURERIE", pageWidth / 2, 25, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Date : ${today}`, 14, 35);
    };

    addHeader();

    // Section 1: Équipements en maintenance
    const maintenanceWeapons = weapons?.filter(w => w.status === 'En maintenance') || [];
    doc.setFontSize(12);
    doc.text("1. Équipements nécessitant une intervention / En maintenance", 14, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['N° Série', 'Modèle', 'Type', 'Dernière Maintenance']],
      body: maintenanceWeapons.map(w => [
        w.serialNumber, 
        w.model, 
        w.type, 
        w.lastMaintenanceDate?.toDate().toLocaleDateString('fr-FR') || 'Jamais'
      ]),
    });

    // Section 2: Affectations en cours
    const activeAssignments = assignments?.filter(a => !a.returnedAt) || [];
    doc.text("2. Affectations en cours (Matériel sorti)", 14, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Agent', 'Matériel', 'Sorti le']],
      body: activeAssignments.map(a => [
        agentsById[a.agentId]?.fullName || 'Inconnu',
        weaponsById[a.weaponId]?.model || 'Inconnu',
        a.assignedAt.toDate().toLocaleString('fr-FR')
      ]),
    });

    doc.save(`rapport_armurerie_${today.replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Armurerie</h1>
          <p className="text-muted-foreground">Gestion du matériel, des munitions et de la maintenance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateDailyReport}>
            <FileText className="mr-2 h-4 w-4" /> Rapport Quotidien
          </Button>
          <Dialog open={isAddWeaponOpen} onOpenChange={setAddWeaponOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Nouvel Équipement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Enregistrer un équipement</DialogTitle></DialogHeader>
              <AddWeaponForm onSuccess={() => setAddWeaponOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={isAssignOpen} onOpenChange={setAssignOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <UserPlus className="mr-2 h-4 w-4" /> Attribuer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Attribuer du matériel à un agent</DialogTitle></DialogHeader>
              <AssignWeaponForm 
                weapons={weapons?.filter(w => w.status === 'Fonctionnel' && (w.type !== 'Munition' || w.quantity > 0)) || []} 
                agents={agents || []} 
                missions={missions || []}
                onSuccess={() => setAssignOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory"><Sword className="mr-2 h-4 w-4" /> Inventaire</TabsTrigger>
          <TabsTrigger value="assignments"><ArrowLeftRight className="mr-2 h-4 w-4" /> Affectations</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-2 h-4 w-4" /> Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>État du Stock</CardTitle>
                  <CardDescription>Liste exhaustive du matériel et des munitions.</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="N° Série ou Modèle..." 
                    className="pl-8" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Série</TableHead>
                    <TableHead>Modèle</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>État/Qté</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weaponsLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center">Chargement...</TableCell></TableRow>
                  ) : filteredWeapons.length > 0 ? (
                    filteredWeapons.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-mono text-xs">{w.serialNumber}</TableCell>
                        <TableCell className="font-medium">{w.model}</TableCell>
                        <TableCell>{w.type}</TableCell>
                        <TableCell>
                          {w.type === 'Munition' ? `${w.quantity} unités` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={w.status === 'Fonctionnel' ? 'default' : w.status === 'En maintenance' ? 'secondary' : 'destructive'}>
                            {w.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleReportIssue(w)}>
                            <AlertTriangle className={cn("h-4 w-4 mr-2", w.status === 'En maintenance' ? "text-green-600" : "text-orange-500")} />
                            {w.status === 'En maintenance' ? 'Remettre en service' : 'Signaler Panne'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Aucun équipement trouvé.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Affectations Actuelles</CardTitle>
              <CardDescription>Liste du matériel actuellement entre les mains des agents.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Matériel</TableHead>
                    <TableHead>Date Sortie</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignmentsLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center">Chargement...</TableCell></TableRow>
                  ) : assignments?.filter(a => !a.returnedAt).length ? (
                    assignments.filter(a => !a.returnedAt).map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{agentsById[a.agentId]?.fullName || '...'}</TableCell>
                        <TableCell>{weaponsById[a.weaponId]?.model || '...'} ({weaponsById[a.weaponId]?.serialNumber})</TableCell>
                        <TableCell>{a.assignedAt.toDate().toLocaleString('fr-FR')}</TableCell>
                        <TableCell className="text-xs text-muted-foreground italic">{a.notes || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => handleReturnWeapon(a)}>Enregistrer Retour</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Aucune affectation en cours.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historique complet</CardTitle>
              <CardDescription>Registre de tous les mouvements de matériel.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Sortie</TableHead>
                    <TableHead>Date Retour</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Matériel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments?.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.assignedAt.toDate().toLocaleString('fr-FR')}</TableCell>
                      <TableCell>
                        {a.returnedAt ? a.returnedAt.toDate().toLocaleString('fr-FR') : <Badge variant="outline">Non retourné</Badge>}
                      </TableCell>
                      <TableCell>{agentsById[a.agentId]?.fullName || '...'}</TableCell>
                      <TableCell>{weaponsById[a.weaponId]?.model || '...'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
