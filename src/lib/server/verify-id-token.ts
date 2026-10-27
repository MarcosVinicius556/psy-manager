import { getAdminAuth } from "@/lib/firebase-admin";
import {
  type FirebaseTokenIdentity,
  identityFromDecodedToken,
  signInProviderFromClaims,
} from "@/lib/server/firebase-token-identity";

type LookupUser = { localId?: string; email?: string; emailVerified?: boolean };

async function lookupWithRest(idToken: string): Promise<FirebaseTokenIdentity | null> {
  const key = process.env.NEXT_PUBLIC_API_KEY;
  if (!key) return null;
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { users?: LookupUser[] };
  const user = data.users?.[0];
  if (!user?.localId) return null;
  return {
    uid: user.localId,
    email: user.email?.toLowerCase() || "",
    emailVerified: user.emailVerified === true,
    signInProvider: "",
  };
}

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseTokenIdentity | null> {
  const auth = getAdminAuth();
  if (auth) {
    try {
      const decoded = await auth.verifyIdToken(idToken);
      return identityFromDecodedToken({
        uid: decoded.uid,
        email: decoded.email,
        email_verified: decoded.email_verified,
        firebase: decoded.firebase as { sign_in_provider?: string } | undefined,
      });
    } catch {
      return null;
    }
  }
  return lookupWithRest(idToken);
}

export function bearerToken(request: Request) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return "";
  return header.slice(7).trim();
}

export { signInProviderFromClaims };
