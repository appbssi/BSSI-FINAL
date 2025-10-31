'use client';

import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import React, { useEffect } from 'react';

const publicPaths = ['/login', '/'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isUserLoading) return;

    const isPublicPath = publicPaths.includes(pathname);

    // If the user is logged in...
    if (user) {
      // and they are on the login page (and not forced), redirect them to the dashboard.
      if (pathname === '/login' && searchParams.get('force') !== 'true') {
        router.push('/dashboard');
      }
      // If the user is on the root landing page, also redirect to dashboard
      else if (pathname === '/') {
        router.push('/dashboard');
      }
    } 
    // If the user is not logged in...
    else {
      // and they are trying to access a protected page, redirect them to the login page.
      if (!isPublicPath) {
        router.push('/login');
      }
    }

  }, [user, isUserLoading, router, pathname, searchParams]);

  // Determine if the loader should be shown
  const showLoader = isUserLoading || 
    (!user && !publicPaths.includes(pathname)) || 
    (user && (pathname === '/login' || pathname === '/') && searchParams.get('force') !== 'true');

  if (showLoader) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="loader"></div>
      </div>
    );
  }

  return <>{children}</>;
}
