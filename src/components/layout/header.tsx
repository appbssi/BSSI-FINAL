'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from './user-nav';
import { RecentActivitiesDialog } from '../dashboard/recent-activities-dialog';
import { Button } from '../ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
            <div className="md:hidden">
                <SidebarTrigger />
            </div>
        </div>

        <div className="flex flex-1 justify-end">
            {/* Espace réservé pour d'éventuels éléments futurs */}
        </div>

      <div className="flex items-center gap-2">
        <RecentActivitiesDialog />
        <UserNav />
      </div>
    </header>
  );
}
