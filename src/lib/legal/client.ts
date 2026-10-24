import { collection, getDocs, query, where } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/admin/firebase";
import type { LegalAcceptanceDocument } from "./config";
import { documentsRequiringAcceptance } from "./versions";

export type LegalAcceptanceRecord = {
  id: string;
  uid: string;
  document: LegalAcceptanceDocument;
  version: string;
  contentHash: string;
  acceptedAt: string;
};

export async function submitLegalAcceptances(documents: LegalAcceptanceDocument[]) {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sessão não encontrada.");
  const token = await user.getIdToken();
  const response = await fetch("/api/legal/accept", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ documents }),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message || "Não foi possível registrar o aceite.");
  }
}

export async function fetchUserLegalAcceptances(uid: string) {
  const snapshot = await getDocs(query(collection(getFirebaseDb(), "legalAcceptances"), where("uid", "==", uid)));
  const rows: LegalAcceptanceRecord[] = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      uid: String(data.uid || ""),
      document: data.document as LegalAcceptanceDocument,
      version: String(data.version || ""),
      contentHash: String(data.contentHash || ""),
      acceptedAt: String(data.acceptedAt || ""),
    };
  });
  const latest: Partial<Record<LegalAcceptanceDocument, string>> = {};
  for (const row of rows) {
    if (!row.document) continue;
    const prev = latest[row.document];
    if (!prev || row.version.localeCompare(prev) > 0) latest[row.document] = row.version;
  }
  return { rows, latest };
}

export function signupAcceptanceDocuments(): LegalAcceptanceDocument[] {
  return ["termos", "privacidade", "dpa"];
}

export function pendingLegalDocuments(
  latest: Partial<Record<LegalAcceptanceDocument, string>>,
  options: { requireDpa: boolean },
) {
  return documentsRequiringAcceptance(latest, options);
}
