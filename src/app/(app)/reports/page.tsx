'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarChart2, PieChart } from 'lucide-react';
import { AgentActivityChart, MissionOutcomesChart } from '@/components/reports/charts';

export default function ReportsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rapports et Statistiques</h1>
        <p className="text-muted-foreground mt-2">
            Visualisez les données clés de vos opérations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-6 w-6 text-primary" />
              <span>Résultats des Missions</span>
            </CardTitle>
            <CardDescription>
                Répartition des missions par statut.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MissionOutcomesChart />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-6 w-6 text-primary" />
              <span>Disponibilité des Agents</span>
            </CardTitle>
            <CardDescription>
                Statut actuel de l'ensemble des agents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AgentActivityChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
