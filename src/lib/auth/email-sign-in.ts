import { FirebaseError } from "firebase/app";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  getMultiFactorResolver,
  setPersistence,
  signInWithEmailAndPassword,
  type MultiFactorError,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/admin/firebase";
import { upsertPsychologist } from "@/lib/admin/collections";
import { MfaSignInRequired } from "./mfa-sign-in";

export async function signInWithEmailAndPasswordFlow(email: string, password: string, remember = true) {
  const auth = getFirebaseAuth();
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    await upsertPsychologist(credential.user.uid, credential.user.email || email.trim());
    return credential.user;
  } catch (error) {
    if (error instanceof FirebaseError && error.code === "auth/multi-factor-auth-required") {
      throw new MfaSignInRequired(getMultiFactorResolver(auth, error as MultiFactorError));
    }
    throw error;
  }
}
