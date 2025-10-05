'use client';

import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { ActivityLog } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';

export default function HistoryPage() {
    const firestore = useFirestore();
    const { user } = useUser();

    const activityLogsQuery = useMemoFirebase(
        () => (firestore && user ? query(collection(firestore, 'activity_logs'), orderBy('timestamp', 'desc')) : null),
        [firestore, user]
    );

    const { data: activityLogs, isLoading: logsLoading } = useCollection<ActivityLog>(activityLogsQuery);

    const getOperationBadgeVariant = (operation: ActivityLog['operation']) => {
        switch (operation) {
            case 'Création':
                return 'outline';
            case 'Modification':
                return 'default';
            case 'Suppression':
                return 'destructive';
            case 'Importation':
            case 'Dédoublonnage':
                return 'secondary';
            default:
                return 'secondary';
        }
    }

    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">Historique des activités</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Journal des événements</CardTitle>
                    <CardDescription>Liste de toutes les actions enregistrées dans l'application.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date et Heure</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Entité</TableHead>
                                    <TableHead>Opération</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">Chargement de l'historique...</TableCell>
                                    </TableRow>
                                ) : activityLogs && activityLogs.length > 0 ? (
                                    activityLogs.map(log => (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                {log.timestamp ? format(log.timestamp.toDate(), "PPP p", { locale: fr }) : 'N/A'}
                                            </TableCell>
                                            <TableCell className="font-medium">{log.action}</TableCell>
                                            <TableCell>{log.entity}</TableCell>
                                            <TableCell>
                                                <Badge variant={getOperationBadgeVariant(log.operation)}>
                                                    {log.operation}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                                            Aucune activité enregistrée.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
