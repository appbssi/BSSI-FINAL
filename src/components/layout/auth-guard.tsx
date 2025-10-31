
'use client';

import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import React, { useEffect } from 'react';

const publicPaths = ['/login', '/'];

/**
 * A client component that guards its children against unauthenticated access.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user status is resolved
    }

    const isPublicPath = publicPaths.includes(pathname);
    const forceLogin = searchParams.get('force') === 'true';

    // If the user is not logged in and not on a public path, redirect to login
    if (!user && !isPublicPath) {
      router.push('/login');
    }

    // If the user is logged in, redirect from /login to /dashboard, unless forced
    if (user && pathname === '/login' && !forceLogin) {
      router.push('/dashboard');
    }

  }, [user, isUserLoading, router, pathname, searchParams]);

  // Show a loader while determining auth state if we are not on a public path
  // or if we are about to be redirected from the login page.
  const isProtectedPathLoading = !isUserLoading && !user && !publicPaths.includes(pathname);
  const isRedirectingFromLogin = !isUserLoading && user && pathname === '/login' && searchParams.get('force') !== 'true';

  if (isUserLoading || isProtectedPathLoading || isRedirectingFromLogin) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="loader"></div>
      </div>
    );
  }

  return <>{children}</>;
}
