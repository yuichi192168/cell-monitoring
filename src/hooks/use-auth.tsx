"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import { User, UserRole } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useFirebaseAuth();
  const db = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Attempt to fetch profile. Firestore persistence handles offline access automatically.
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              name: userData.name || 'User',
              email: firebaseUser.email || '',
              role: userData.role || 'Member',
            });
          } else {
            // Fallback for cases where auth exists but doc doesn't (rare)
            setUser(null);
          }
        } catch (error) {
          console.warn("Auth profile fetch failed (likely offline). User session retained.");
          // If offline, we can't get the latest role/name if not cached, 
          // but we keep the session active to avoid a hard logout.
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
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
      
      // We don't await the setDoc so the UI can proceed immediately (Firestore queues it)
      const { setDoc } = await import('firebase/firestore');
      setDoc(userDocRef, newUser);
      
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
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
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