import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "./firebase";
import { DASHBOARD_LAYOUT_VERSION, sanitizeLayout, type DashboardLayout } from "./dashboard-layout";

/** Field on the user's own `users/{uid}` profile document that keeps the dashboard layout. */
const FIELD = "dashboardLayout";

function storageKey(uid: string) {
  return `psy-manager:dashboard-layout:${uid || "anon"}`;
}

function readLocal(uid: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(uid));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(uid: string, layout: DashboardLayout) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(uid), JSON.stringify(layout));
  } catch {
    // Storage cheio ou bloqueado: o layout continua valendo nesta sessão.
  }
}

function serialize(layout: DashboardLayout) {
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    widgets: layout.widgets.map(({ id, visible, width, height }) => ({ id, visible, width, height })),
  };
}

/** Loads the user's layout from Firestore, falling back to the local copy (or the default layout). */
export async function loadDashboardLayout(uid: string | null | undefined): Promise<DashboardLayout> {
  const key = uid || "";
  if (key && isFirebaseConfigured()) {
    try {
      const snapshot = await getDoc(doc(getFirebaseDb(), "users", key));
      const saved = snapshot.data()?.[FIELD];
      if (saved) {
        const layout = sanitizeLayout(saved);
        writeLocal(key, layout);
        return layout;
      }
    } catch (error) {
      console.error(error);
    }
  }
  return sanitizeLayout(readLocal(key));
}

/**
 * Saves the layout locally and, when Firebase is configured, on the user's profile document.
 * Returns where it was persisted so the screen can warn when only the local copy was saved.
 */
export async function saveDashboardLayout(uid: string | null | undefined, layout: DashboardLayout): Promise<"firestore" | "local"> {
  const key = uid || "";
  const clean = serialize(sanitizeLayout(layout));
  writeLocal(key, clean);
  if (!key || !isFirebaseConfigured()) return "local";
  await updateDoc(doc(getFirebaseDb(), "users", key), { [FIELD]: clean });
  return "firestore";
}