
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LogoContextType {
  logo: string | null;
  setLogo: (logo: string | null) => void;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export function LogoProvider({ children }: { children: ReactNode }) {
  const [logo, setLogoState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const savedLogo = localStorage.getItem('app-logo');
      if (savedLogo) {
        setLogoState(savedLogo);
      }
    } catch (error) {
      console.error("Failed to read logo from localStorage", error);
    }
    setIsInitialized(true);
  }, []);

  const setLogo = (newLogo: string | null) => {
    try {
      setLogoState(newLogo);
      if (newLogo) {
        localStorage.setItem('app-logo', newLogo);
      } else {
        localStorage.removeItem('app-logo');
      }
    } catch (error) {
        console.error("Failed to save logo to localStorage", error);
    }
  };
  
  if (!isInitialized) {
    return null; // or a loading spinner
  }

  return (
    <LogoContext.Provider value={{ logo, setLogo }}>
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
