
'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Search, Trash2, Loader2, FileDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, deleteDoc, doc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, errorEmitter } from '@/firebase';
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
import { useRole } from '@/hooks/use-role';
import { useLogo } from '@/context/logo-context';
import type { Visitor } from '@/lib/types';
import { RegisterVisitorSheet } from '@/components/secretariat/register-visitor-sheet';
import { EditVisitorSheet } from '@/components/secretariat/edit-visitor-sheet';
import { FirestorePermissionError } from '@/firebase/errors';

export default function SecretariatPage() {
  const firestore = useFirestore();
  const { isObserver } = useRole();
  const { logo } = useLogo();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterOpen, setRegisterOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
  const [visitorToDelete, setVisitorToDelete] = useState<Visitor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const visitorsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'visitors') : null), [firestore]);
  const { data: visitors, isLoading: visitorsLoading } = useCollection<Visitor>(visitorsQuery);

  const sortedVisitors = useMemo(() => {
    if (!visitors) return [];
    return [...visitors].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  }, [visitors]);

  const filteredVisitors = sortedVisitors.filter(visitor => {
    const searchString = `${visitor.firstName} ${visitor.lastName} ${visitor.occupation}`.toLowerCase();
    return searchString.includes(searchQuery.toLowerCase());
  });

  const handleDeleteVisitor = async () => {
    if (!firestore || !visitorToDelete) return;
    setIsDeleting(true);

    const visitorRef = doc(firestore, 'visitors', visitorToDelete.id);
    deleteDoc(visitorRef).then(() => {
        toast({
        title: 'Visiteur supprimé',
        description: `Le visiteur ${visitorToDelete.firstName} ${visitorToDelete.lastName} a été supprimé.`,
        });
        setVisitorToDelete(null);
    }).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: visitorRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    }).finally(() => {
        setIsDeleting(false);
    });
  };

  const handleExportXLSX = () => {
    const dataToExport = filteredVisitors.map(visitor => ({
        'Date': visitor.createdAt.toDate().toLocaleDateString('fr-FR'),
        'Prénom': visitor.firstName,
        'Nom': visitor.lastName,
        'Contact': visitor.contact,
        'Fonction': visitor.occupation,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Visiteurs');
    XLSX.writeFile(workbook, 'liste_visiteurs.xlsx');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const tableTitle = "Liste des Visiteurs";
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
            head: [['Date', 'Prénom', 'Nom', 'Contact', 'Fonction']],
            body: filteredVisitors.map(v => [
                v.createdAt.toDate().toLocaleString('fr-FR'),
                v.firstName,
                v.lastName,
                v.contact,
                v.occupation,
            ]),
            startY: currentY,
            theme: 'striped',
            headStyles: { fillColor: [39, 55, 70] },
        });
        doc.save('liste_visiteurs.pdf');
    };

    if (logo) {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => addContent(img);
        img.onerror = () => addContent(null);
        img.src = logo;
    } else {
        addContent(null);
    }
  };


  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Secrétariat - Registre des Visiteurs</h1>
      </div>
      
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Rechercher un visiteur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        <div className="flex items-center gap-2">
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FileDown className="mr-2 h-4 w-4" /> Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={handleExportPDF}>Exporter en PDF</DropdownMenuItem>
                <DropdownMenuItem onSelect={handleExportXLSX}>Exporter en XLSX</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          {!isObserver && (
            <Button onClick={() => setRegisterOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Enregistrer un visiteur
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visiteur</TableHead>
              <TableHead>Fonction</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Date d'enregistrement</TableHead>
              {!isObserver && <TableHead><span className="sr-only">Actions</span></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visitorsLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Chargement des visiteurs...</TableCell>
              </TableRow>
            ) : (
              filteredVisitors.map((visitor) => (
                  <TableRow key={visitor.id}>
                    <TableCell>
                      <div className="font-medium">{visitor.lastName.toUpperCase()} {visitor.firstName}</div>
                    </TableCell>
                    <TableCell>{visitor.occupation}</TableCell>
                    <TableCell>{visitor.contact}</TableCell>
                    <TableCell>{visitor.createdAt.toDate().toLocaleString('fr-FR')}</TableCell>
                    {!isObserver && (
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
                            <DropdownMenuItem onSelect={() => setEditingVisitor(visitor)}>Modifier</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setVisitorToDelete(visitor)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                Supprimer
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    )}
                  </TableRow>
                ))
            )}
            {!visitorsLoading && filteredVisitors.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Aucun visiteur trouvé.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <RegisterVisitorSheet 
        isOpen={isRegisterOpen} 
        onOpenChange={setRegisterOpen}
      />

      {editingVisitor && (
        <EditVisitorSheet
          visitor={editingVisitor}
          isOpen={!!editingVisitor}
          onOpenChange={(open) => !open && setEditingVisitor(null)}
        />
      )}

      {visitorToDelete && (
        <AlertDialog open={!!visitorToDelete} onOpenChange={(open) => !open && setVisitorToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous absolument sûr?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le visiteur{' '}
                <span className="font-semibold">{`${visitorToDelete.firstName} ${visitorToDelete.lastName}`}</span> sera définitivement supprimé.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setVisitorToDelete(null)}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteVisitor} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
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
