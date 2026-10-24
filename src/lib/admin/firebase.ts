import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

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

function ensureApp() {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase não configurado. Preencha as variáveis NEXT_PUBLIC no arquivo .env.local.");
  }
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
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
