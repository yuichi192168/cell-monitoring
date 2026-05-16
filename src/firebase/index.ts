'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export function initializeFirebase() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  // Use a singleton pattern to avoid multiple initializations of Firestore with cache
  if (!firestoreInstance) {
    try {
      // Try to initialize with persistence
      firestoreInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
    } catch (e) {
      // If already initialized, fallback to getFirestore
      firestoreInstance = getFirestore(app);
    }
  }

  if (!authInstance) {
    authInstance = getAuth(app);
  }
  
  return { app, db: firestoreInstance, auth: authInstance };
}

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';