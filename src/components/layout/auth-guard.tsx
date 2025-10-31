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

    if (user && pathname === '/login' && searchParams.get('force') !== 'true') {
      router.push('/dashboard');
    } else if (!user && !isPublicPath) {
      router.push('/login');
    }

  }, [user, isUserLoading, router, pathname, searchParams]);

  // Render a loader while auth state is resolving, or during redirection.
  const showLoader = isUserLoading || 
    (!user && !publicPaths.includes(pathname)) || 
    (user && pathname === '/login' && searchParams.get('force') !== 'true');

  if (showLoader) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="loader"></div>
      </div>
    );
  }

  return <>{children}</>;
}
