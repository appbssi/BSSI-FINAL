
'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Ce composant écoute les erreurs de permission Firebase.
 * Pour éviter de bloquer l'utilisateur, nous logguons l'erreur au lieu de la throw.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // On log l'erreur pour le debug mais on ne throw plus pour éviter le crash de l'UI
      console.warn('Firestore Permission Error (Ignored):', error.message);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}
