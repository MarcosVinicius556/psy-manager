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
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/admin/firebase";
import { prefersGoogleRedirect } from "@/lib/admin/google-auth-flow";

const EMAIL_STORAGE_KEY = "psy_patient_portal_email";

export type PatientProfile = {
  linked: boolean;
  registered?: boolean;
  active: boolean;
  profileComplete: boolean;
  patientNome?: string;
  profissionalNome?: string;
  email?: string;
  reason?: string;
  connectionsCount?: number;
};

type PatientAuthContextValue = {
  configured: boolean;
  user: User | null;
  loading: boolean;
  profile: PatientProfile | null;
  refreshProfile: () => Promise<void>;
  bootstrapPortalAccount: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLink: (email: string, linkUrl: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOutPatient: () => Promise<void>;
};

const PatientAuthContext = createContext<PatientAuthContextValue | null>(null);

const authErrors: Record<string, string> = {
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/email-already-in-use": "Este e-mail já está em uso.",
  "auth/weak-password": "Use uma senha com pelo menos 6 caracteres.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco.",
  "auth/popup-closed-by-user": "A janela do Google foi fechada antes de concluir.",
  "auth/operation-not-allowed":
    "O login com Google ainda não está disponível neste portal. Use e-mail e senha ou o código do seu psicólogo(a).",
  "auth/configuration-not-found":
    "O login com Google ainda não está configurado. Use e-mail e senha ou o código do seu psicólogo(a).",
};

function messageOf(error: unknown) {
  if (error instanceof FirebaseError) return authErrors[error.code] || "Não foi possível concluir.";
  return error instanceof Error ? error.message : "Não foi possível concluir.";
}

export function PatientAuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PatientProfile | null>(null);

  const attemptEmailAutoLink = useCallback(async () => {
    const auth = getFirebaseAuth();
    const current = auth.currentUser;
    if (!current?.emailVerified) return;
    const idToken = await current.getIdToken();
    await fetch("/api/patient/auth/link", {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
    });
  }, []);

  const bootstrapPortalAccount = useCallback(async () => {
    const auth = getFirebaseAuth();
    const current = auth.currentUser;
    if (!current) return;
    const idToken = await current.getIdToken();
    const res = await fetch("/api/patient/auth/register", {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const reason = typeof data.reason === "string" ? data.reason : "falha_registro";
      throw new Error(reason);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const idToken = await user.getIdToken(true);
    const me = await fetch("/api/patient/auth/me", { headers: { Authorization: `Bearer ${idToken}` } });
    const data = await me.json();
    setProfile({
      linked: Boolean(data.linked),
      registered: Boolean(data.registered),
      active: Boolean(data.active),
      profileComplete: Boolean(data.profileComplete),
      patientNome: data.patientNome,
      profissionalNome: data.profissionalNome,
      email: data.email,
      reason: data.reason,
      connectionsCount: data.connectionsCount,
    });
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
    void (async () => {
      try {
        await bootstrapPortalAccount();
      } catch {
        /* registro pode falhar para conta profissional */
      }
      await refreshProfile();
    })();
  }, [user, bootstrapPortalAccount, refreshProfile]);

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
    await bootstrapPortalAccount();
    await attemptEmailAutoLink();
    await refreshProfile();
  }, [bootstrapPortalAccount, attemptEmailAutoLink, refreshProfile]);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    await bootstrapPortalAccount();
    await attemptEmailAutoLink();
  }, [bootstrapPortalAccount, attemptEmailAutoLink]);

  const signUpWithPassword = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    try {
      await sendEmailVerification(credential.user);
    } catch {
      /* verificação opcional em dev */
    }
    await bootstrapPortalAccount();
  }, [bootstrapPortalAccount]);

  const signInWithGoogle = useCallback(async () => {
    if (prefersGoogleRedirect()) {
      throw new Error("Use o login por e-mail neste navegador ou abra no Chrome/Safari.");
    }
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    await bootstrapPortalAccount();
    await attemptEmailAutoLink();
  }, [bootstrapPortalAccount, attemptEmailAutoLink]);

  const sendPasswordReset = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    await sendPasswordResetEmail(auth, email.trim().toLowerCase(), {
      url: `${window.location.origin}/paciente/login`,
    });
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
      bootstrapPortalAccount,
      sendMagicLink,
      completeMagicLink,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      sendPasswordReset,
      signOutPatient,
    }),
    [
      configured,
      user,
      loading,
      profile,
      refreshProfile,
      bootstrapPortalAccount,
      sendMagicLink,
      completeMagicLink,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      sendPasswordReset,
      signOutPatient,
    ]
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

export function patientAuthErrorMessage(error: unknown) {
  return messageOf(error);
}
