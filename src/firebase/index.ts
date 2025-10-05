
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// This variable will hold the singleton instance of the Firebase app.
let firebaseApp: FirebaseApp;

/**
 * Initializes Firebase, creating a singleton instance of the app and its services.
 * This function ensures that Firebase is initialized only once.
 */
export function initializeFirebase() {
  if (!getApps().length) {
    // Initialize the app if it hasn't been already.
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    // If it has been initialized, get the existing app instance.
    firebaseApp = getApp();
  }

  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  
  // This listener ensures we sign in anonymously as soon as auth is available.
  // It only attempts to sign in if there's no current user.
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
      });
    }
  });

  return {
    firebaseApp,
    auth,
    firestore,
  };
}

// Re-export other necessary modules.
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
