'use client';

import { useUser, useAuth } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { signOut } from 'firebase/auth';

const publicPaths = ['/'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) return;

    const isPublicPath = publicPaths.includes(pathname);

    // If user is logged in but on the public landing/login page,
    // log them out to force re-authentication.
    if (user && isPublicPath) {
      signOut(auth);
      // The onAuthStateChanged listener will handle the user state change
      // and keep them on the login page.
      return; 
    }

    // If user is not logged in and not on a public path, redirect to login.
    if (!user && !isPublicPath) {
      router.push('/');
    }
  }, [user, isUserLoading, router, pathname, auth]);

  // Show loader during auth check or when redirecting.
  const showLoader = isUserLoading || (!user && !publicPaths.includes(pathname));

  if (showLoader) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="loader"></div>
      </div>
    );
  }

  return <>{children}</>;
}
