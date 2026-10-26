"use client";

import { getFirebaseAuth } from "@/lib/admin/firebase";

export async function patientFetch(path: string, init?: RequestInit) {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("nao_autenticado");
  const idToken = await user.getIdToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...(init?.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = typeof data.reason === "string" ? data.reason : "erro";
    throw new Error(reason);
  }
  return data;
}
