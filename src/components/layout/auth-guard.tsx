
'use client';

import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';

const publicPaths = ['/login', '/'];

/**
 * A client component that guards its children against unauthenticated access.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user status is resolved
    }

    const isPublicPath = publicPaths.includes(pathname);

    if (!user && !isPublicPath) {
      router.push('/login');
    }

    if (user && isPublicPath) {
      // Allow access to landing page even if logged in, but not login page
      if (pathname === '/login') {
        router.push('/dashboard');
      }
    }
  }, [user, isUserLoading, router, pathname]);

  // Show loading indicator while determining auth state or redirecting (but not for public pages)
  const isRedirecting = (!user && !publicPaths.includes(pathname)) || (user && pathname === '/login');
  
  if (isUserLoading || isRedirecting) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="loader"></div>
      </div>
    );
  }

  return <>{children}</>;
}
