"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import { User, UserRole } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useFirebaseAuth();
  const db = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Use onSnapshot for the user doc to handle offline access immediately
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser({
              id: firebaseUser.uid,
              name: userData.name || 'User',
              email: firebaseUser.email || '',
              role: userData.role || 'Member',
            });
          }
          setIsLoading(false);
          setIsInitialized(true);
        }, (error) => {
          console.warn("Auth profile listener error (expected if doc not in cache yet):", error);
          setIsLoading(false);
          setIsInitialized(true);
        });
      } else {
        setUser(null);
        setIsLoading(false);
        setIsInitialized(true);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, [auth, db]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      errorEmitter.emit('auth-error', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const newUser = {
        name,
        email,
        role,
        status: 'Active',
        ladderOfSuccess: [],
        targetToDo: [],
        createdAt: new Date().toISOString(),
      };
      
      // Queued for sync automatically by Firestore persistence
      const { setDoc } = await import('firebase/firestore');
      await setDoc(userDocRef, newUser);
      
      setUser({
        id: firebaseUser.uid,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role as UserRole,
      });
    } catch (error: any) {
      errorEmitter.emit('auth-error', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await signOut(auth);
    setUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}