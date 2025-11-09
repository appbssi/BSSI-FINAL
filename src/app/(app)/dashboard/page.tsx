
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
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-background flex justify-center items-center">
      <iframe 
        src="https://assets.pinterest.com/ext/embed.html?id=39336196741137249" 
        height="438" 
        width="450" 
        frameBorder="0" 
      ></iframe>
    </div>
  );
}
