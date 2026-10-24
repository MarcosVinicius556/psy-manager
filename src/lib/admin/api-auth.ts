import { getFirebaseAuth } from "./firebase";

export async function authorizedHeaders(extra?: HeadersInit) {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Faça login para continuar.");
  const token = await user.getIdToken();
  const headers = new Headers(extra);
  headers.set("Authorization", `Bearer ${token}`);
  return headers;
}
