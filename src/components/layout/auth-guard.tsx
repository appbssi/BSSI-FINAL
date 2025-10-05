'use client';

import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import React from 'react';

/**
 * A client component that guards its children, showing a loading state
 * until the Firebase user's authentication state is determined.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 text-lg">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement de la session...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
