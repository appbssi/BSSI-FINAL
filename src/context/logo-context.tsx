
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, DocumentData } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/provider';

interface LogoContextType {
  logo: string | null;
  setLogo: (logo: string | null) => void;
  isLogoLoading: boolean;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export function LogoProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const settingsDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'settings', 'app') : null),
    [firestore, user]
  );
  
  const { data: settingsData, isLoading: isDocLoading } = useDoc<{ logo: string }>(settingsDocRef);
  
  const [logo, setLogoState] = useState<string | null>(null);

  useEffect(() => {
    if (settingsData) {
      setLogoState(settingsData.logo);
    } else {
      setLogoState(null);
    }
  }, [settingsData]);


  const setLogo = useCallback(async (newLogo: string | null) => {
    if (!firestore || !user) {
        toast({
            variant: 'destructive',
            title: 'Erreur',
            description: 'Vous devez être connecté pour changer le logo.',
        });
        return;
    }
    
    setLogoState(newLogo); // Optimistic update

    try {
        const docRef = doc(firestore, 'settings', 'app');
        await setDoc(docRef, { logo: newLogo }, { merge: true });
    } catch (error) {
        console.error("Failed to save logo to Firestore", error);
        toast({
            variant: 'destructive',
            title: 'Erreur de sauvegarde',
            description: 'Impossible d\'enregistrer le nouveau logo.',
        });
        // Revert optimistic update on error
        setLogoState(settingsData?.logo ?? null); 
    }
  }, [firestore, user, toast, settingsData]);
  
  const isLogoLoading = isUserLoading || isDocLoading;

  return (
    <LogoContext.Provider value={{ logo, setLogo, isLogoLoading }}>
      {children}
    </LogoContext.Provider>
  );
}

export function useLogo() {
  const context = useContext(LogoContext);
  if (context === undefined) {
    throw new Error('useLogo must be used within a LogoProvider');
  }
  return context;
}
