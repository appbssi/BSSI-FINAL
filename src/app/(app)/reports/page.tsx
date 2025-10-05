import { AgentActivityChart, MissionOutcomesChart } from '@/components/reports/charts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mission Outcomes</CardTitle>
            <CardDescription>A breakdown of mission statuses over the last year.</CardDescription>
          </CardHeader>
          <CardContent>
            <MissionOutcomesChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Agent Activity</CardTitle>
            <CardDescription>Current availability status of all agents.</CardDescription>
          </CardHeader>
          <CardContent>
            <AgentActivityChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
