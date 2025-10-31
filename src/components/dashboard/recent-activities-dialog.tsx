
'use client';

import { Button } from '../ui/button';
import { Bell } from 'lucide-react';

export function RecentActivitiesDialog() {
  // This component is now only for the notification icon.
  // The actual dialog/list is shown on the dashboard page itself.
  return (
    <Button variant="ghost" size="icon" className="relative p-2 bg-card text-primary align-middle rounded-full hover:text-white hover:bg-primary focus:outline-none">
        <Bell className="h-6 w-6" />
        <span className="sr-only">Notifications</span>
        {/* You can add a notification badge here if needed */}
        {/* <span aria-hidden="true" className="absolute top-0 right-0 inline-block w-3 h-3 transform translate-x-1 -translate-y-1 bg-red-600 border-2 border-white rounded-full"></span> */}
    </Button>
  );
}
