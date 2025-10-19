
'use client';

import { useEffect, useState } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Force le thème clair en retirant la classe 'dark'
    document.documentElement.classList.remove('dark');
  }, []);

  if (!isMounted) {
    // Évite les problèmes d'hydratation en ne rendant rien côté serveur
    return null;
  }

  return <>{children}</>;
}
