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
  ResponsiveContainer,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip
} from '@/components/ui/chart';
import type { Agent, Mission } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { getDisplayStatus } from '@/lib/missions';
import { useMemo } from 'react';
import { getAgentAvailability } from '@/lib/agents';

export function MissionOutcomesChart() {
  const firestore = useFirestore();
  const { user } = useUser();

  const missionsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'missions')) : null),
    [firestore, user]
  );
  const { data: missions, isLoading } = useCollection<Mission>(missionsQuery);

  const outcomesData = useMemo(() => {
    if (!missions) return [];
    
    return missions.reduce((acc, mission) => {
        const status = getDisplayStatus(mission);
        const existing = acc.find(item => item.status === status);
        if (existing) {
            existing.count++;
        } else {
            acc.push({ status, count: 1 });
        }
        return acc;
    }, [] as { status: string, count: number }[]);
  }, [missions]);

  const chartConfig = {
    count: {
      label: "Missions",
    },
    'En cours': {
      label: 'En cours',
      color: 'hsl(var(--chart-2))',
    },
    'Terminée': {
      label: 'Terminées',
      color: 'hsl(var(--chart-1))',
    },
    'Planification': {
      label: 'Planifiées',
      color: 'hsl(var(--chart-3))',
    },
    'Annulée': {
      label: 'Annulées',
      color: 'hsl(var(--chart-5))',
    },
  };

  if (isLoading) {
    return <div className="h-[300px] w-full flex items-center justify-center">Chargement...</div>;
  }

  if (outcomesData.length === 0) {
    return <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">Aucune mission à afficher.</div>;
  }
  

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={outcomesData}
            dataKey="count"
            nameKey="status"
            innerRadius={60}
            strokeWidth={5}
            label={({
              payload,
              ...props
            }) => {
              return (
                <text
                  cx={props.cx}
                  cy={props.cy}
                  x={props.x}
                  y={props.y}
                  textAnchor={props.textAnchor}
                  dominantBaseline={props.dominantBaseline}
                  fill="hsla(var(--foreground))"
                  className="text-sm"
                >
                  {payload.status} ({payload.count})
                </text>
              )
            }}
             labelLine={false}
          >
            {outcomesData.map((entry) => (
              <Cell
                key={entry.status}
                fill={chartConfig[entry.status as keyof typeof chartConfig]?.color || 'hsl(var(--chart-4))'}
                className="focus:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export function AgentActivityChart() {
  const firestore = useFirestore();

  const agentsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'agents') : null, [firestore]);
  const missionsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'missions') : null, [firestore]);
  
  const { data: agents, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);
  const { data: missions, isLoading: missionsLoading } = useCollection<Mission>(missionsQuery);

  const agentActivityData = useMemo(() => {
    if (!agents || !missions) return [];
    
    return agents.reduce((acc, agent) => {
        const availability = getAgentAvailability(agent, missions);
        const existing = acc.find(item => item.availability === availability);
        if (existing) {
            existing.count++;
        } else {
            acc.push({ availability, count: 1 });
        }
        return acc;
    }, [] as { availability: string, count: number }[]);
  }, [agents, missions]);

  const chartConfig = {
    count: {
      label: 'Agents',
    },
    'Disponible': {
      label: 'Disponible',
      color: 'hsl(var(--chart-1))',
    },
    'En mission': {
      label: 'En mission',
      color: 'hsl(var(--chart-2))',
    },
    'En congé': {
      label: 'En congé',
      color: 'hsl(var(--chart-5))',
    },
  };

  const isLoading = agentsLoading || missionsLoading;

  if (isLoading) {
    return <div className="h-[300px] w-full flex items-center justify-center">Chargement...</div>;
  }

  if (agentActivityData.length === 0) {
    return <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">Aucun agent à afficher.</div>;
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={agentActivityData}
          layout="vertical"
          margin={{ left: 10, right: 10 }}
          accessibilityLayer
        >
          <CartesianGrid horizontal={false} />
          <YAxis
            dataKey="availability"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label || value}
            className="text-xs"
          />
          <XAxis dataKey="count" type="number" hide />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />
          <Bar
            dataKey="count"
            radius={5}
            barSize={32}
          >
             {agentActivityData.map((entry) => (
                <Cell 
                    key={entry.availability} 
                    fill={chartConfig[entry.availability as keyof typeof chartConfig]?.color || 'hsl(var(--chart-4))'} 
                />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}