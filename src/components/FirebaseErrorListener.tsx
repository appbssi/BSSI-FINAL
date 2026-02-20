'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Ce composant écoute les erreurs de permission et les erreurs globales de Firestore.
 * Il empêche les erreurs internes du SDK de faire planter l'application.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    // Gestion des erreurs de permission personnalisées
    const handlePermissionError = (error: FirestorePermissionError) => {
      console.warn('Firestore Permission (Silenced):', error.message);
    };

    // Gestion des erreurs globales (crash SDK, assertion failed, etc.)
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.message?.includes('firebase') || event.message?.includes('firestore')) {
        console.warn('Firebase SDK Internal Error (Intercepted):', event.message);
        event.preventDefault(); // Empêche la propagation du crash
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('firebase') || event.reason?.message?.includes('firestore')) {
        console.warn('Firebase Async Error (Intercepted):', event.reason.message);
        event.preventDefault();
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
