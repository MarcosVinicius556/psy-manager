"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { getFirebaseAuth, isFirebaseConfigured } from "./firebase";
import { getUserRole, upsertPsychologist } from "./collections";

export type UserRole = "super_admin" | "psicologo";

type AuthContextValue = {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>;
  signInWithGoogle: (remember?: boolean) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    let active = true;
    let request = 0;
    const unsubscribe = onAuthStateChanged(auth, (next) => {
      const id = ++request;
      setUser(next);
      if (!next) {
        setRole(null);
        setLoading(false);
        return;
      }
      getUserRole(next.uid)
        .then((nextRole) => {
          if (active && id === request) setRole(nextRole);
        })
        .catch(() => {
          if (active && id === request) setRole("psicologo");
        })
        .finally(() => {
          if (active && id === request) setLoading(false);
        });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [configured]);

  async function signIn(email: string, password: string, remember = true) {
    const auth = getFirebaseAuth();
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await upsertPsychologist(credential.user.uid, credential.user.email || email.trim());
    } catch (error) {
      if (error instanceof FirebaseError) throw error;
      throw error;
    }
  }

  async function signInWithGoogle(remember = true) {
    const auth = getFirebaseAuth();
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const credential = await signInWithPopup(auth, provider);
    const email = credential.user.email?.trim().toLowerCase();
    if (!email) {
      await signOut(auth);
      throw new Error("A conta Google não informou um e-mail.");
    }
    await upsertPsychologist(credential.user.uid, email, {
      nome: credential.user.displayName || "",
      foto: credential.user.photoURL || "",
    });
  }

  async function sendPasswordReset(email: string) {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  }

  async function logout() {
    await signOut(getFirebaseAuth());
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, configured, signIn, signInWithGoogle, sendPasswordReset, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
