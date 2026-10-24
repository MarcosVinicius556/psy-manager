import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App | null = null;

function parseServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    try {
      return JSON.parse(json) as { project_id?: string; client_email?: string; private_key?: string };
    } catch {
      return null;
    }
  }
  const email = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID?.trim();
  if (!email || !privateKey || !projectId) return null;
  return { project_id: projectId, client_email: email, private_key: privateKey };
}

export function getFirebaseAdminApp() {
  if (app) return app;
  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }
  const serviceAccount = parseServiceAccount();
  if (!serviceAccount?.client_email || !serviceAccount.private_key) return null;
  app = initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id || process.env.NEXT_PUBLIC_PROJECT_ID,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
  });
  return app;
}

export function getAdminAuth() {
  const adminApp = getFirebaseAdminApp();
  if (!adminApp) return null;
  return getAuth(adminApp);
}

export function getAdminDb() {
  const adminApp = getFirebaseAdminApp();
  if (!adminApp) return null;
  return getFirestore(adminApp);
}
