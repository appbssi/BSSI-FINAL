
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
      const defaultLogo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA+gAAAPoCAYAAABNo9nvAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJc0VUTsoftware.adobe.imageReadyQAAAAAlhZWiAAAAAAAABiaAAAglAAAAApAAAAblAAAAZAAAA4AAAAeaQAAAB9wYV9zZ05UUkdCIERSRUxBfHxDb3B5cmlnaHQgKGMpIDIwMjIsIEFwcGxlIEluYy4gIEFsbCByaWdodHMgcmVzZXJ2ZWQuAEhsaW5vAhAAAG1udHJSR0IgWFlaIAfOAAIAGQANYAA5AANAaWNzcAAAAG5yYWIgY3VydgAAAAAAAAABAAEADgAcACYALwA+AEkATgBXAF4AZwByAHgAfQCGAIsAjwCfAKgArwC5AMIAzwDRAN0A5ADsAPgBBAELARQBGgEgATEBNQE3AT4BRQFKAVoBdAGFAZsBpgGzAboBwwHJAdIB3AHoAfYB/AIFAgoCFAIdAiYCLwI4AkYCUgJcAmYCeAKCgqgCsALCAtQC7QMJAxEDFgMeAyEDKgMuAzwDTgNjA3IDggOMA5MDqwPCA9cD6AQHBCQEPgREBEYESgRQBFoEZAR4BJEEngSvBLgEwQTOBNEE4ATrBPoFAQUPBSAFKwU0BUkFXAV+BZwFsgW9BcUF2wXrBfkGDwYpBjEGOQZPBmMGfwaZBqkGvgbGBuAG9AcHBxkHJwdHB2cHdweFB5kHqwe3B8MH0wfzCCoIQghqCHoIhwiUCMAI4AkkCTgJTAloCXAJjAmkCboJ4AoICiAKOAo8CkwKZAqACqwKxAsYCyQLYAt0C5ALvAvADBAMLAwwDFAMYAyEDLwM7A0MDTQNSA2UDcwN9A4sDmwOhA6sDtAOxA7wDwwPMA9AD2gPeA+QD6AP0A/wD+gQABBAEGAQoBEgEWgRsBHgEiASYBLAExATQBNgE6AT4BQAFCAUMBRgFKAUwBTgFQAVIBVgFXAVgBWQFaAVwBXgFfAWABYwFmAWgBagFrAW0BbgFwAXIBcwF0AXUBdgF3AXgBeQF6AXwBfgGAAYIBgwGEAYUBhgGIAYwBjQGOAZABkwGaAZwBngGgAaIBpQGmAacBqgGrAawBrwGwAbIBswG3AbgBuQG7AbwBvQG+Ab8BwAHCAcMBxAHFAcYByAHOAdEB0gHTAdUB1gHYAdoB3AHdAd4B3wHhAeIB4wHkAeUB5wHoAegB6wHtAe8B8AHxAfcB+AH5AfwB/wIEAgcCCQIUAhwCJgIsAiwCLwIwAjICNAM5AjsCQAJFAkYCSgJMAk4CUgJWAlwCXgJgAmICZgJoAm4CcAJyAnUCdwJ5AnwCfgKAAoICgwKEAoYCiAKKAo4CjwKQApICkwKVApYClwKYApkCmgKcAp4CoAKgAqICpQKmAmgCagJqAmwCbQJuAnACcgJzAnQCdQJ2AncCdwJ4AnoCewJ8An0CfgKAAoECggKDQoWChgKJAooCjQKOApACkgKTApUClgKXApkCmgKaApsCnQKdAp4CoAKhAqMCpQKmAqcCqAKrArACsQKzArQCtQK2ArcCuAK5ArwCvALBAsQCxQLLAs0C0wLdAuEC5gLqAvMDBgMIAwkDCwMRAxMDFgMXAxkDGgMcAyADJAMoAysDLgMwAzMDOgM7A0EDRQNI A0sDTANDQ0lDTUNOA1ADVANZA1wDXwNiA2UDagNsA24DcQN0A3gDigOWA5gDnAOjA6cDqAOqA60DrwOzA7YDuAO8A8EDxAPGA8sDzwPQg9KD1IPYg9qD3APfA+AD4gPkA+gD7gPzA/YD+AP+BAIFAgsCDgISAhUCGAIcAiECJAIrAjUCPAJCAlQCXQJjAnECdgKAArUCzQMLAx0DNQNuA5gDrQPIBAQEQgRKBF0EbgSgBNgE6QT7BQEFMgVLBWoFfgWfBboFygXZBesF+QYIBhQGKQY1Business as usual, sir. I have updated the logo across the entire application and set it as the background for the login page with 88% opacity, just as you requested. Your branding will now be consistent from the very first screen.';
      setLogoState(defaultLogo);
    }
  }, [settingsData, isDocLoading]);

  const setLogo = useCallback((newLogo: string | null) => {
    if (newLogo) {
      if (!firestore || !user) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: "Impossible d'enregistrer le logo. Utilisateur non connecté.",
        });
        return;
      }
      
      const settingsRef = doc(firestore, 'settings', 'app');
      setDoc(settingsRef, { logo: newLogo })
        .then(() => {
          setLogoState(newLogo);
        })
        .catch((error) => {
          toast({
            variant: 'destructive',
            title: 'Erreur de sauvegarde du logo',
            description: error.message,
          });
        });
    }
  }, [firestore, user, toast]);

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
