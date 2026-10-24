"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  getMultiFactorResolver,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type MultiFactorError,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPasswordFlow } from "@/lib/auth/email-sign-in";
import { MfaSignInRequired } from "@/lib/auth/mfa-sign-in";
import { getFirebaseAuth, isFirebaseConfigured } from "./firebase";
import { getUserRole, upsertPsychologist } from "./collections";
import { googleProfileFromUser, prefersGoogleRedirect, rememberGoogleSignInRoute } from "./google-auth-flow";

export type UserRole = "super_admin" | "psicologo";

type AuthContextValue = {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  googleAuthBusy: boolean;
  configured: boolean;
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>;
  signInWithGoogle: (remember?: boolean) => Promise<{ eligible: boolean; pendingRedirect?: boolean }>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function completeGoogleProfile(user: User) {
  const email = user.email?.trim().toLowerCase();
  if (!email) {
    await signOut(getFirebaseAuth());
    throw new Error("A conta Google não informou um e-mail.");
  }
  const profile = googleProfileFromUser(user);
  const { trialEligible } = await upsertPsychologist(profile.uid, profile.email, { nome: profile.nome, foto: profile.foto });
  return { eligible: trialEligible };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleAuthBusy, setGoogleAuthBusy] = useState(false);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    let active = true;
    let request = 0;

    setGoogleAuthBusy(true);
    getRedirectResult(auth)
      .then(async (credential) => {
        if (!credential) return;
        try {
          const result = await completeGoogleProfile(credential.user);
          rememberGoogleSignInRoute(result.eligible);
        } catch (error) {
          console.error(error);
          if (error instanceof FirebaseError && error.code === "auth/operation-not-allowed") return;
          await signOut(auth).catch(() => undefined);
        }
      })
      .catch((error) => {
        console.error(error);
        if (error instanceof FirebaseError && error.code === "auth/operation-not-allowed") return;
      })
      .finally(() => {
        if (active) setGoogleAuthBusy(false);
      });

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
    await signInWithEmailAndPasswordFlow(email, password, remember);
  }

  async function signInWithGoogle(remember = true) {
    const auth = getFirebaseAuth();
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    if (prefersGoogleRedirect()) {
      await signInWithRedirect(auth, provider);
      return { eligible: true, pendingRedirect: true };
    }

    try {
      const credential = await signInWithPopup(auth, provider);
      const result = await completeGoogleProfile(credential.user);
      rememberGoogleSignInRoute(result.eligible);
      return result;
    } catch (error) {
      if (error instanceof FirebaseError && error.code === "auth/multi-factor-auth-required") {
        throw new MfaSignInRequired(getMultiFactorResolver(auth, error as MultiFactorError));
      }
      if (error instanceof FirebaseError && error.code === "auth/popup-blocked") {
        await signInWithRedirect(auth, provider);
        return { eligible: true, pendingRedirect: true };
      }
      if (error instanceof FirebaseError && error.code === "auth/popup-closed-by-user") {
        throw error;
      }
      if (error instanceof FirebaseError && error.code === "auth/operation-not-allowed") {
        throw error;
      }
      if (error instanceof FirebaseError) throw error;
      throw error;
    }
  }

  async function sendPasswordReset(email: string) {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  }

  async function logout() {
    await signOut(getFirebaseAuth());
  }

  return (
    <AuthContext.Provider
      value={{ user, role, loading, googleAuthBusy, configured, signIn, signInWithGoogle, sendPasswordReset, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
