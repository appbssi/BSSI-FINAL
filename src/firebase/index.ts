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
    
    // NOTE: Emulator connection logic has been removed to resolve network errors.
    // The application will now connect to production Firebase services.

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