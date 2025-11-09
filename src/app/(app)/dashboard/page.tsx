
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
  Newspaper,
  Calendar,
  MapPin,
  Loader2,
  Info,
} from 'lucide-react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import type { Agent, Mission, MissionStatus } from '@/lib/types';
import { useMemo, useState, useEffect } from 'react';
import { getAgentAvailability } from '@/lib/agents';
import { getDisplayStatus, MissionWithDisplayStatus } from '@/lib/missions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MissionDetailsDialog } from '@/components/missions/mission-details-dialog';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RecentActivities } from '@/components/dashboard/recent-activities';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const firestore = useFirestore();

  const agentsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'agents') : null), [firestore]);
  const missionsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'missions') : null), [firestore]);

  const { data: agents, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);
  const { data: missions, isLoading: missionsLoading } = useCollection<Mission>(missionsQuery);
  
  const [selectedMission, setSelectedMission] = useState<MissionWithDisplayStatus | null>(null);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    if (!agents || !missions) {
      return { totalAgents: 0, onMission: 0, available: 0, completedMissions: 0 };
    }

    const onMission = new Set<string>();
    const onLeave = new Set<string>();

    for (const agent of agents) {
      const availability = getAgentAvailability(agent, missions);
      if (availability === 'En mission') {
        onMission.add(agent.id);
      } else if (availability === 'En congé') {
        onLeave.add(agent.id);
      }
    }
    
    const available = agents.length - onMission.size - onLeave.size;
    
    const completedMissions = missions.filter(m => getDisplayStatus(m) === 'Terminée').length;

    return {
      totalAgents: agents.length,
      onMission: onMission.size,
      available: available,
      completedMissions: completedMissions,
    };
  }, [agents, missions, now]);

  const missionsWithStatus: MissionWithDisplayStatus[] = useMemo(() => {
    if (!missions) return [];
    return missions.map(mission => ({
      ...mission,
      displayStatus: getDisplayStatus(mission),
    }));
  }, [missions, now]);

  const ongoingMissions = useMemo(() => {
    return missionsWithStatus.filter(mission => mission.displayStatus === 'En cours');
  }, [missionsWithStatus]);
  
  const agentsById = useMemo(() => {
    if (!agents) return {};
    return agents.reduce((acc, agent) => {
      acc[agent.id] = agent;
      return acc;
    }, {} as Record<string, Agent>);
  }, [agents]);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
      </div>

      {(agentsLoading || missionsLoading) ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
             <Card key={i} className="flex flex-col justify-between p-6 rounded-2xl">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <div className="h-5 w-32 bg-muted rounded-md animate-pulse"></div>
                        <div className="h-9 w-16 bg-muted rounded-md animate-pulse"></div>
                    </div>
                    <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agents au Total</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAgents}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agents en Mission</CardTitle>
              <Shield className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.onMission}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agents Disponibles</CardTitle>
              <UserCheck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.available}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missions Terminées</CardTitle>
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedMissions}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl">
          <CardHeader>
            <CardTitle>Missions en cours ({ongoingMissions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {ongoingMissions.length > 0 ? (
                <ScrollArea className="h-72">
                  <div className="space-y-4">
                    {ongoingMissions.map((mission) => (
                      <div key={mission.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedMission(mission)}>
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="font-semibold">{mission.name}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> {mission.location}
                              </p>
                           </div>
                           <Badge variant="default">{mission.displayStatus}</Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mt-2 gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{mission.startDate.toDate().toLocaleDateString('fr-FR')} - {mission.endDate.toDate().toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center h-72 text-muted-foreground">
                  <p>Aucune mission en cours pour le moment.</p>
                </div>
              )}
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl">
            <CardHeader>
                <CardTitle>Activités Récentes</CardTitle>
                <CardDescription>Les dernières actions effectuées dans l'application.</CardDescription>
            </CardHeader>
            <CardContent>
                <RecentActivities />
            </CardContent>
        </Card>
      </div>

       {selectedMission && (
        <MissionDetailsDialog
          isOpen={!!selectedMission}
          onOpenChange={() => setSelectedMission(null)}
          mission={selectedMission}
          agents={(selectedMission.assignedAgentIds || []).map(id => agentsById[id]).filter(Boolean)}
        />
      )}
    </div>
  );
}
