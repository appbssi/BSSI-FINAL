import { AgentActivityChart, MissionOutcomesChart } from '@/components/reports/charts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Rapports</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Résultats des missions</CardTitle>
            <CardDescription>Répartition des statuts de mission au cours de la dernière année.</CardDescription>
          </CardHeader>
          <CardContent>
            <MissionOutcomesChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activité des agents</CardTitle>
            <CardDescription>Statut de disponibilité actuel de tous les agents.</CardDescription>
          </CardHeader>
          <CardContent>
            <AgentActivityChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
