'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

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

  // Always get the auth instance from the singleton app.
  const auth = getAuth(firebaseApp);
  
  // Automatically sign in the user anonymously if they are not already signed in.
  // This is crucial for consistent auth state.
  if (!auth.currentUser) {
    signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
    });
  }
  
  // Return the singleton app and its services.
  return {
    firebaseApp,
    auth,
    firestore: getFirestore(firebaseApp)
  };
}

// Re-export other necessary modules.
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';