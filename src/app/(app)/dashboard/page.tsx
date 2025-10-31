
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
  Newspaper
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

  const isLoading = agentsLoading || missionsLoading;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-background">
      <div className="flex items-center h-10">
        <h2 className="mr-5 text-lg font-medium truncate">Tableau de bord</h2>
      </div>
      <div className="grid grid-cols-12 gap-6 mt-5">
        <Card className="transform hover:scale-105 transition duration-300 col-span-12 sm:col-span-6 xl:col-span-3 intro-y bg-card">
          <CardContent className="p-5">
            <div className="flex justify-between">
              <Users className="h-7 w-7 text-blue-400" />
            </div>
            <div className="ml-2 w-full flex-1">
              <div>
                <div className="mt-3 text-3xl font-bold leading-8">{isLoading ? '...' : totalAgents}</div>
                <div className="mt-1 text-base text-muted-foreground">Agents au Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transform hover:scale-105 transition duration-300 col-span-12 sm:col-span-6 xl:col-span-3 intro-y bg-card">
          <CardContent className="p-5">
            <div className="flex justify-between">
              <Shield className="h-7 w-7 text-yellow-400" />
            </div>
            <div className="ml-2 w-full flex-1">
              <div>
                <div className="mt-3 text-3xl font-bold leading-8">{isLoading ? '...' : agentsOnMission}</div>
                <div className="mt-1 text-base text-muted-foreground">Agents en Mission</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transform hover:scale-105 transition duration-300 col-span-12 sm:col-span-6 xl:col-span-3 intro-y bg-card">
          <CardContent className="p-5">
            <div className="flex justify-between">
              <UserCheck className="h-7 w-7 text-pink-600" />
            </div>
            <div className="ml-2 w-full flex-1">
              <div>
                <div className="mt-3 text-3xl font-bold leading-8">{isLoading ? '...' : availableAgents}</div>
                <div className="mt-1 text-base text-muted-foreground">Agents Disponibles</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transform hover:scale-105 transition duration-300 col-span-12 sm:col-span-6 xl:col-span-3 intro-y bg-card">
          <CardContent className="p-5">
            <div className="flex justify-between">
              <CheckCircle className="h-7 w-7 text-green-400" />
            </div>
            <div className="ml-2 w-full flex-1">
              <div>
                <div className="mt-3 text-3xl font-bold leading-8">{isLoading ? '...' : completedMissions}</div>
                <div className="mt-1 text-base text-muted-foreground">Missions Terminées</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5"/>Résultats des missions</CardTitle>
                </CardHeader>
                <CardContent>
                    <MissionOutcomesChart />
                </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5"/>Activité des Agents</CardTitle>
                </CardHeader>
                <CardContent>
                    <AgentActivityChart />
                </CardContent>
            </Card>
        </div>
      </div>
      
       <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Activités Récentes</CardTitle>
              <CardDescription>Journal des dernières actions dans l'application.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72">
                 {activitiesLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <p>Chargement des activités...</p>
                    </div>
                ) : activities && activities.length > 0 ? (
                    <div className="space-y-4">
                        {activities.map(activity => (
                             <div key={activity.id} className="flex items-start gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xl">
                                    {getActivityIcon(activity.type)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm text-foreground">{activity.description}</p>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <p>
                                            {formatDistanceToNow(activity.timestamp.toDate(), { addSuffix: true, locale: fr })}
                                        </p>
                                        {activity.link && (
                                            <Button asChild variant="link" size="sm" className="p-0 h-auto text-primary">
                                                <Link href={activity.link}>Voir</Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                   <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <Newspaper className="h-12 w-12 mb-4" />
                        <p>Aucune activité récente à afficher.</p>
                    </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
       </div>
    </div>
  );
}
