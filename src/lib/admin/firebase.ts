import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
};

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let emulatorsConnected = false;

function connectEmulatorsIfNeeded(authInstance: Auth, dbInstance: Firestore) {
  if (emulatorsConnected || process.env.NEXT_PUBLIC_FIREBASE_EMULATOR !== "true") return;
  if (typeof window === "undefined") return;
  const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || "127.0.0.1";
  const authPort = Number(process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT || "9099");
  const firestorePort = Number(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || "8080");
  connectAuthEmulator(authInstance, `http://${host}:${authPort}`, { disableWarnings: true });
  connectFirestoreEmulator(dbInstance, host, firestorePort);
  emulatorsConnected = true;
}

function ensureApp() {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase não configurado. Preencha as variáveis NEXT_PUBLIC no arquivo .env.local.");
  }
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    connectEmulatorsIfNeeded(auth, db);
  }
  return app;
}

export function getFirebaseAuth() {
  ensureApp();
  return auth as Auth;
}

export function getFirebaseDb() {
  ensureApp();
  return db as Firestore;
}

export function getRegistrationAuth() {
  ensureApp();
  const name = "user-registration";
  const existing = getApps().find((item) => item.name === name);
  const secondary = existing ?? initializeApp(firebaseConfig, name);
  return getAuth(secondary);
}
