
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Users,
  Shield,
  UserCheck,
  CheckCircle,
  BarChart,
  PieChartIcon,
  Activity,
  Newspaper,
  Calendar,
  MapPin
} from 'lucide-react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import type { Agent, Mission, ActivityLog } from '@/lib/types';
import { useMemo, useState, useEffect } from 'react';
import { getAgentAvailability } from '@/lib/agents';
import { getDisplayStatus } from '@/lib/missions';
import { AgentActivityChart, MissionOutcomesChart } from '@/components/reports/charts';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const getActivityIcon = (type: ActivityLog['type']) => {
    switch (type) {
        case 'Agent': return '🧑‍✈️';
        case 'Mission': return '🚀';
        case 'Rassemblement': return '👥';
        case 'Visiteur': return '👤';
        default: return '⚙️';
    }
};

export default function DashboardPage() {
  const firestore = useFirestore();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const agentsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'agents') : null), [firestore]);
  const missionsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'missions') : null), [firestore]);
  const activitiesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'activities'), orderBy('timestamp', 'desc'), limit(10)) : null),
    [firestore]
  );

  const { data: agents, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);
  const { data: missions, isLoading: missionsLoading } = useCollection<Mission>(missionsQuery);
  const { data: activities, isLoading: activitiesLoading } = useCollection<ActivityLog>(activitiesQuery);
  
  const missionsWithDisplayStatus = useMemo(() => {
    if (!missions) return [];
    return missions.map(mission => ({
      ...mission,
      displayStatus: getDisplayStatus(mission),
    }));
  }, [missions, now]);

  const agentsWithAvailability = useMemo(() => {
    if (!agents || !missions) return [];
    return agents.map(agent => ({
      ...agent,
      availability: getAgentAvailability(agent, missions)
    }));
  }, [agents, missions, now]);

  const totalAgents = agents?.length ?? 0;
  const agentsOnMission = agentsWithAvailability?.filter(a => a.availability === 'En mission').length ?? 0;
  const availableAgents = agentsWithAvailability?.filter(a => a.availability === 'Disponible').length ?? 0;
  const completedMissions = missionsWithDisplayStatus.filter(m => m.displayStatus === 'Terminée').length ?? 0;
  
  const ongoingMissions = useMemo(() => 
    missionsWithDisplayStatus.filter(m => m.displayStatus === 'En cours'),
    [missionsWithDisplayStatus]
  );
  const ongoingMissionsCount = ongoingMissions.length;

  const isLoading = agentsLoading || missionsLoading;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-background">
      <div className="flex items-center h-10">
        <h2 className="mr-5 text-lg font-medium truncate">Tableau de bord</h2>
      </div>
      <div className="grid grid-cols-12 gap-6 mt-5">
        <Card className="transform hover:scale-105 transition duration-300 col-span-12 sm:col-span-6 xl:col-span-3 intro-y bg-white text-black">
          <CardContent className="p-5">
            <div className="flex justify-between">
              <Users className="h-7 w-7 text-blue-400" />
            </div>
            <div className="ml-2 w-full flex-1">
              <div>
                <div className="mt-3 text-3xl font-bold leading-8">{isLoading ? '...' : totalAgents}</div>
                <div className="mt-1 text-base text-gray-600">Agents au Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transform hover:scale-105 transition duration-300 col-span-12 sm:col-span-6 xl:col-span-3 intro-y bg-white text-black">
          <CardContent className="p-5">
            <div className="flex justify-between">
              <Shield className="h-7 w-7 text-yellow-400" />
            </div>
            <div className="ml-2 w-full flex-1">
              <div>
                <div className="mt-3 text-3xl font-bold leading-8">{isLoading ? '...' : agentsOnMission}</div>
                <div className="mt-1 text-base text-gray-600">Agents en Mission</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transform hover:scale-105 transition duration-300 col-span-12 sm:col-span-6 xl:col-span-3 intro-y bg-white text-black">
          <CardContent className="p-5">
            <div className="flex justify-between">
              <UserCheck className="h-7 w-7 text-pink-600" />
            </div>
            <div className="ml-2 w-full flex-1">
              <div>
                <div className="mt-3 text-3xl font-bold leading-8">{isLoading ? '...' : availableAgents}</div>
                <div className="mt-1 text-base text-gray-600">Agents Disponibles</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transform hover:scale-105 transition duration-300 col-span-12 sm:col-span-6 xl:col-span-3 intro-y bg-white text-black">
          <CardContent className="p-5">
            <div className="flex justify-between">
              <CheckCircle className="h-7 w-7 text-green-400" />
            </div>
            <div className="ml-2 w-full flex-1">
              <div>
                <div className="mt-3 text-3xl font-bold leading-8">{isLoading ? '...' : completedMissions}</div>
                <div className="mt-1 text-base text-gray-600">Missions Terminées</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
