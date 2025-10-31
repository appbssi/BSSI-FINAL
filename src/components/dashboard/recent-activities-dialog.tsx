'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { Bell } from 'lucide-react';
import { RecentActivities } from './recent-activities';

export function RecentActivitiesDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Voir les activités récentes</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Activités Récentes</DialogTitle>
          <DialogDescription>
            Journal des dernières actions effectuées dans l'application.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
            <RecentActivities />
        </div>
      </DialogContent>
    </Dialog>
  );
}
