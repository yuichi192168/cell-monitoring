'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './config';

export function initializeFirebase() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  // Enable Offline Persistence with multi-tab support
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
  
  const auth = getAuth(app);
  
  return { app, db, auth };
}

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
