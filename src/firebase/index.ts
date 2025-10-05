'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// This variable will hold the singleton instances of the Firebase services.
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

// This flag ensures that the auth listener is only set up once.
let isAuthListenerInitialized = false;

/**
 * Initializes Firebase, creating a singleton instance of the app and its services.
 * This function ensures that Firebase is initialized only once.
 */
export function initializeFirebase() {
  if (!getApps().length) {
    // Initialize the app if it hasn't been already.
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  } else {
    // If it has been initialized, get the existing app instance.
    firebaseApp = getApp();
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  }

  // Set up the anonymous sign-in listener only once.
  if (!isAuthListenerInitialized) {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous sign-in failed:", error);
        });
      }
    });
    isAuthListenerInitialized = true;
  }

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
