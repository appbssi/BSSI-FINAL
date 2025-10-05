
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import type { User } from 'firebase/auth';

type Role = 'admin' | 'observer' | null;

interface UseRoleResult {
  role: Role;
  isRoleLoading: boolean;
  isAdmin: boolean;
  isObserver: boolean;
}

async function getRoleFromClaims(user: User): Promise<Role> {
  try {
    const idTokenResult = await user.getIdTokenResult(true); // Force refresh
    return (idTokenResult.claims.role as Role) || null;
  } catch (error) {
    console.error("Error getting user role from claims:", error);
    return null;
  }
}

export function useRole(): UseRoleResult {
  const { user, isUserLoading } = useUser();
  const [role, setRole] = useState<Role>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) {
      setIsRoleLoading(true);
      return;
    }

    if (!user) {
      setRole(null);
      setIsRoleLoading(false);
      return;
    }

    setIsRoleLoading(true);
    getRoleFromClaims(user)
      .then(userRole => {
        setRole(userRole);
      })
      .finally(() => {
        setIsRoleLoading(false);
      });

  }, [user, isUserLoading]);
  
  return { 
    role, 
    isRoleLoading: isUserLoading || isRoleLoading,
    isAdmin: role === 'admin',
    isObserver: role === 'observer'
  };
}
