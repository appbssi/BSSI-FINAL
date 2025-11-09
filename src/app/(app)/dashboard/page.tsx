
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
  const [now, setNow] = useState(new Date());
  const [selectedMission, setSelectedMission] = useState<MissionWithDisplayStatus | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const agentsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'agents') : null), [firestore]);
  const missionsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'missions') : null), [firestore]);

  const { data: agents, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);
  const { data: missions, isLoading: missionsLoading } = useCollection<Mission>(missionsQuery);
  
  const missionsWithDisplayStatus: MissionWithDisplayStatus[] = useMemo(() => {
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
  
  const agentsById = useMemo(() => {
    if (!agents) return {};
    return agents.reduce((acc, agent) => {
      acc[agent.id] = agent;
      return acc;
    }, {} as Record<string, Agent>);
  }, [agents]);

  const totalAgents = agents?.length ?? 0;
  const agentsOnMission = agentsWithAvailability?.filter(a => a.availability === 'En mission').length ?? 0;
  const availableAgents = agentsWithAvailability?.filter(a => a.availability === 'Disponible').length ?? 0;
  const completedMissions = missionsWithDisplayStatus.filter(m => m.displayStatus === 'Terminée').length ?? 0;
  
  const ongoingMissions = useMemo(() => 
    missionsWithDisplayStatus
      .filter(m => m.displayStatus === 'En cours')
      .sort((a, b) => a.startDate.toMillis() - b.startDate.toMillis()),
    [missionsWithDisplayStatus]
  );
  const ongoingMissionsCount = ongoingMissions.length;

  const isLoading = agentsLoading || missionsLoading;

  const assignedAgentsForSelectedMission = useMemo(() => {
    if (!selectedMission || !agentsById) return [];
    return selectedMission.assignedAgentIds.map(id => agentsById[id]).filter(Boolean);
  }, [selectedMission, agentsById]);

   const getBadgeVariant = (status: MissionStatus) => {
    switch (status) {
      case 'En cours': return 'default';
      case 'Terminée': return 'outline';
      case 'Annulée': return 'destructive';
      case 'Planification': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-background">
      <div className="flex items-center h-10">
        <h2 className="mr-5 text-lg font-medium truncate">Tableau de bord</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-5">
        
        {/* Main Stats Cards */}
        <div className="blob-card">
          <div className="blob" />
          <div className="blob-card-bg">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground/80">
                    <Users className="h-5 w-5" />
                    Agents au Total
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-4xl font-bold text-foreground">{isLoading ? '...' : totalAgents}</div>
              </CardContent>
          </div>
        </div>
        <div className="blob-card">
          <div className="blob" />
          <div className="blob-card-bg">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground/80">
                    <Shield className="h-5 w-5" />
                    Agents en Mission
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-4xl font-bold text-foreground">{isLoading ? '...' : agentsOnMission}</div>
              </CardContent>
          </div>
        </div>
        <div className="blob-card">
          <div className="blob" />
          <div className="blob-card-bg">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground/80">
                    <UserCheck className="h-5 w-5" />
                    Agents Disponibles
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-4xl font-bold text-foreground">{isLoading ? '...' : availableAgents}</div>
              </CardContent>
          </div>
        </div>
        <div className="blob-card">
          <div className="blob" />
          <div className="blob-card-bg">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground/80">
                    <CheckCircle className="h-5 w-5" />
                    Missions Terminées
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-4xl font-bold text-foreground">{isLoading ? '...' : completedMissions}</div>
              </CardContent>
          </div>
        </div>
        
        {/* Ongoing Missions */}
         <Card className="md:col-span-2 lg:col-span-4">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Missions en cours ({ongoingMissionsCount})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : ongoingMissions.length > 0 ? (
                    <ScrollArea className="h-[40vh]">
                        <div className="space-y-4">
                            <Dialog>
                                {ongoingMissions.map((mission) => (
                                    <DialogTrigger asChild key={mission.id} onClick={() => setSelectedMission(mission)}>
                                        <div className="p-4 rounded-xl border bg-card cursor-pointer hover:bg-accent transition-colors">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-semibold">{mission.name}</h4>
                                                <Badge variant={getBadgeVariant(mission.displayStatus)}>{mission.displayStatus}</Badge>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>{mission.location}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4" />
                                                    <span>{mission.assignedAgentIds.length} agent(s)</span>
                                                </div>
                                                <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>
                                                        {mission.startDate.toDate().toLocaleDateString('fr-FR')} - {mission.endDate.toDate().toLocaleDateString('fr-FR')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </DialogTrigger>
                                ))}
                                {selectedMission && (
                                    <MissionDetailsDialog
                                        isOpen={!!selectedMission}
                                        onOpenChange={(open) => !open && setSelectedMission(null)}
                                        mission={selectedMission}
                                        agents={assignedAgentsForSelectedMission}
                                    />
                                )}
                            </Dialog>
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                        <Shield className="h-10 w-10 mb-2" />
                        <p>Aucune mission en cours pour le moment.</p>
                    </div>
                )}
            </CardContent>
        </Card>

         {/* Recent Activities */}
        <Card className="md:col-span-2 lg:col-span-4">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Newspaper className="h-5 w-5" />
               Activités Récentes
             </CardTitle>
             <CardDescription>
                Les dernières actions effectuées dans l'application.
             </CardDescription>
           </CardHeader>
           <CardContent>
             <RecentActivities />
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
