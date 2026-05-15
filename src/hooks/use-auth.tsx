
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import { User, UserRole } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  login: (requestedRole?: UserRole) => Promise<void>;
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
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            id: firebaseUser.uid,
            name: userData.name || firebaseUser.displayName || 'Anonymous',
            email: firebaseUser.email || '',
            role: userData.role || 'Member',
            avatarUrl: userData.avatarUrl || firebaseUser.photoURL || undefined,
          });
        } else {
          // Fallback if doc doesn't exist yet but user is authed
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

  const login = async (requestedRole: UserRole = 'Member') => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const newUser = {
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          role: requestedRole, // For MVP demo purposes, we allow setting role on first login
          status: 'Active',
          ladderOfSuccess: [],
          targetToDo: [],
          avatarUrl: firebaseUser.photoURL,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newUser);
        setUser({
          id: firebaseUser.uid,
          name: newUser.name || '',
          email: newUser.email || '',
          role: newUser.role as UserRole,
          avatarUrl: newUser.avatarUrl || undefined,
        });
      }
    } catch (error) {
      console.error("Login failed", error);
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
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
