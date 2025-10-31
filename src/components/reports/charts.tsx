'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Pie,
  PieChart,
  Cell,
  Legend,
  Tooltip as RechartsTooltip,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Agent, Mission } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { getDisplayStatus } from '@/lib/missions';

export function MissionOutcomesChart() {
  const firestore = useFirestore();
  const { user } = useUser();

  const missionsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'missions'), where('status', '!=', 'Annulée')) : null),
    [firestore, user]
  );
  const { data: missions, isLoading } = useCollection<Mission>(missionsQuery);

  const ongoingMissionsData = missions
    ?.map(mission => ({
      ...mission,
      displayStatus: getDisplayStatus(mission),
    }))
    .filter(mission => mission.displayStatus === 'En cours')
    .map(mission => ({
        name: mission.name.length > 15 ? `${mission.name.substring(0, 15)}...` : mission.name,
        'En cours': 1,
    })) || [];


  if (isLoading) {
    return <div className="h-[300px] w-full flex items-center justify-center">Chargement...</div>;
  }

  if (ongoingMissionsData.length === 0) {
    return <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">Aucune mission en cours.</div>;
  }

  return (
    <ChartContainer
      config={{
        'En cours': { label: 'En cours', color: 'hsl(var(--chart-1))' },
      }}
      className="h-[300px] w-full"
    >
      <BarChart
        data={ongoingMissionsData}
        margin={{ top: 20, right: 20, bottom: 5, left: 0 }}
        layout="vertical"
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <XAxis dataKey="En cours" type="number" hide />
        <RechartsTooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
        <Bar dataKey="En cours" fill="var(--color-En cours)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

const COLORS = ['hsl(var(--chart-2))', 'hsl(var(--chart-1))', 'hsl(var(--chart-5))'];

export function AgentActivityChart() {
  const firestore = useFirestore();
  const { user } = useUser();

  const agentsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'agents') : null),
    [firestore, user]
  );

  const { data: agents, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);

  const agentActivityData = agents?.reduce((acc, agent) => {
    const status = agent.availability;
    const existing = acc.find(item => item.name === status);
    if(existing) {
        existing.value++;
    } else {
        acc.push({ name: status, value: 1 });
    }
    return acc;
  }, [] as { name: string, value: number }[]) || [];

  if (agentsLoading) {
    return <div className="h-[300px] w-full flex items-center justify-center">Chargement...</div>;
  }

  return (
    <ChartContainer config={{}} className="h-[300px] w-full">
      <PieChart>
        <RechartsTooltip content={<ChartTooltipContent />} />
        <Pie
          data={agentActivityData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({
            cx,
            cy,
            midAngle,
            innerRadius,
            outerRadius,
            value,
            index,
          }) => {
            const RADIAN = Math.PI / 180;
            const radius = 25 + innerRadius + (outerRadius - innerRadius);
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);

            return (
              <text
                x={x}
                y={y}
                fill="hsl(var(--foreground))"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="text-xs"
              >
                {agentActivityData[index].name} ({value})
              </text>
            );
          }}
        >
          {agentActivityData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend />
      </PieChart>
    </ChartContainer>
  );
}
