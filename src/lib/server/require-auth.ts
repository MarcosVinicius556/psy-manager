import { NextResponse } from "next/server";
import { isVerifiedForEmailLinking } from "@/lib/server/firebase-token-identity";
import { bearerToken, verifyFirebaseIdToken } from "@/lib/server/verify-id-token";

export type AuthUser = {
  uid: string;
  email: string;
  idToken: string;
  emailVerified: boolean;
  signInProvider: string;
  emailTrustedForLinking: boolean;
  error?: undefined;
};

export type AuthUserError = { error: NextResponse };

export type AuthUserResult = AuthUser | AuthUserError;

export async function requireAuthUser(request: Request): Promise<AuthUserResult> {
  const idToken = bearerToken(request);
  if (!idToken) {
    return { error: NextResponse.json({ reason: "nao_autorizado" }, { status: 401 }) };
  }
  const identity = await verifyFirebaseIdToken(idToken);
  if (!identity) {
    return { error: NextResponse.json({ reason: "nao_autorizado" }, { status: 401 }) };
  }
  const user: AuthUser = {
    uid: identity.uid,
    email: identity.email,
    idToken,
    emailVerified: identity.emailVerified,
    signInProvider: identity.signInProvider,
    emailTrustedForLinking: isVerifiedForEmailLinking(identity),
  };
  return user;
}
