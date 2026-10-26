"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/admin/firebase";

const EMAIL_STORAGE_KEY = "psy_patient_portal_email";

type PatientProfile = {
  linked: boolean;
  active: boolean;
  patientNome?: string;
  profissionalNome?: string;
  email?: string;
};

type PatientAuthContextValue = {
  configured: boolean;
  user: User | null;
  loading: boolean;
  profile: PatientProfile | null;
  refreshProfile: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLink: (email: string, linkUrl: string) => Promise<void>;
  signOutPatient: () => Promise<void>;
};

const PatientAuthContext = createContext<PatientAuthContextValue | null>(null);

export function PatientAuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PatientProfile | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const idToken = await user.getIdToken();
    const me = await fetch("/api/patient/auth/me", { headers: { Authorization: `Bearer ${idToken}` } });
    const data = await me.json();
    setProfile(data as PatientProfile);
  }, [user]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      setLoading(false);
    });
  }, [configured]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    void refreshProfile();
  }, [user, refreshProfile]);

  const sendMagicLink = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    const normalized = email.trim().toLowerCase();
    const url = `${window.location.origin}/paciente/auth/finalizar`;
    await sendSignInLinkToEmail(auth, normalized, { url, handleCodeInApp: true });
    window.localStorage.setItem(EMAIL_STORAGE_KEY, normalized);
  }, []);

  const completeMagicLink = useCallback(async (email: string, linkUrl: string) => {
    const auth = getFirebaseAuth();
    if (!isSignInWithEmailLink(auth, linkUrl)) throw new Error("link_invalido");
    await signInWithEmailLink(auth, email.trim().toLowerCase(), linkUrl);
    window.localStorage.removeItem(EMAIL_STORAGE_KEY);
    const idToken = await auth.currentUser?.getIdToken();
    if (idToken) {
      await fetch("/api/patient/auth/link", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
    }
  }, []);

  const signOutPatient = useCallback(async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      configured,
      user,
      loading,
      profile,
      refreshProfile,
      sendMagicLink,
      completeMagicLink,
      signOutPatient,
    }),
    [configured, user, loading, profile, refreshProfile, sendMagicLink, completeMagicLink, signOutPatient]
  );

  return <PatientAuthContext.Provider value={value}>{children}</PatientAuthContext.Provider>;
}

export function usePatientAuth() {
  const ctx = useContext(PatientAuthContext);
  if (!ctx) throw new Error("usePatientAuth fora do PatientAuthProvider");
  return ctx;
}

export function storedPatientEmail() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(EMAIL_STORAGE_KEY) || "";
}
