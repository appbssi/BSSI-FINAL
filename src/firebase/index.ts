'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { initiateAnonymousSignIn } from './non-blocking-login';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    const app = initializeApp(firebaseConfig);
    
    // In development, connect to emulators.
    // In production, these will no-op and connect to live services.
    if (process.env.NODE_ENV === 'development') {
       try {
        const auth = getAuth(app);
        // It's important to check if the emulators are already connected
        // to avoid re-connecting, which can cause issues.
        if (!(auth as any)._emulatorConfig) {
            connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        }

        const db = getFirestore(app);
        // A simple check to see if the host is already set to the emulator.
        if (!(db as any)._settings.host.includes('127.0.0.1')) {
            connectFirestoreEmulator(db, '127.0.0.1', 8080);
        }
       } catch (e) {
        console.error("Error connecting to emulators:", e)
       }
    }

    // Automatically sign in the user anonymously if they are not already signed in.
    const auth = getAuth(app);
    if (!auth.currentUser) {
      initiateAnonymousSignIn(auth);
    }
    
    return getSdks(app);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  const auth = getAuth(firebaseApp);
  // Automatically sign in the user anonymously if they are not already signed in.
  // This is useful for client-side apps that need a UID without a full login flow.
  if (!auth.currentUser) {
    initiateAnonymousSignIn(auth);
  }
  return {
    firebaseApp,
    auth,
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';