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
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { agents, missions } from '@/lib/data';

const missionStatusData = missions.reduce((acc, mission) => {
    const month = mission.startDate.toLocaleString('default', { month: 'short' });
    if (!acc[month]) {
        acc[month] = { month, completed: 0, ongoing: 0, planning: 0 };
    }
    if (mission.status === 'Completed') acc[month].completed++;
    if (mission.status === 'Ongoing') acc[month].ongoing++;
    if (mission.status === 'Planning') acc[month].planning++;
    return acc;
}, {} as Record<string, { month: string, completed: number, ongoing: number, planning: number }>);


export function MissionOutcomesChart() {
  return (
    <ChartContainer
      config={{
        completed: { label: 'Completed', color: 'hsl(var(--chart-2))' },
        ongoing: { label: 'Ongoing', color: 'hsl(var(--chart-1))' },
      }}
      className="h-[300px] w-full"
    >
      <BarChart
        data={Object.values(missionStatusData)}
        margin={{ top: 20, right: 20, bottom: 5, left: 0 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <RechartsTooltip content={<ChartTooltipContent />} />
        <Legend />
        <Bar dataKey="completed" stackId="a" fill="var(--color-completed)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="ongoing" stackId="a" fill="var(--color-ongoing)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}


const agentActivityData = agents.reduce((acc, agent) => {
    const status = agent.availability;
    const existing = acc.find(item => item.name === status);
    if(existing) {
        existing.value++;
    } else {
        acc.push({ name: status, value: 1 });
    }
    return acc;
}, [] as { name: string, value: number }[]);


const COLORS = ['hsl(var(--chart-2))', 'hsl(var(--chart-1))', 'hsl(var(--chart-5))'];

export function AgentActivityChart() {
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
