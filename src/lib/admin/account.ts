import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential, signOut, updatePassword, updateProfile } from "firebase/auth";
import { authorizedHeaders } from "./api-auth";
import { getFirebaseAuth, getRegistrationAuth } from "./firebase";

function currentUser() {
  const user = getFirebaseAuth().currentUser;
  if (!user?.email) throw new Error("Entre novamente para continuar.");
  return user;
}

export async function reauthenticate(password: string) {
  const user = currentUser();
  const credential = EmailAuthProvider.credential(user.email as string, password);
  await reauthenticateWithCredential(user, credential);
}

export async function changePassword(currentPassword: string, nextPassword: string) {
  await reauthenticate(currentPassword);
  await updatePassword(currentUser(), nextPassword);
}

export async function createAuthUser(email: string, password: string, nome: string) {
  const auth = getRegistrationAuth();
  const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  await updateProfile(credential.user, { displayName: nome.trim() });
  const uid = credential.user.uid;
  await signOut(auth);
  return uid;
}

export async function updateAuthProfile(patch: { displayName?: string; photoURL?: string }) {
  await updateProfile(currentUser(), patch);
}

export async function uploadAvatar(file: File) {
  const user = currentUser();
  const form = new FormData();
  form.append("file", file);
  const headers = await authorizedHeaders();
  const response = await fetch("/api/image/upload?accept=foto&kind=avatar", {
    method: "POST",
    headers,
    body: form,
  });
  const data = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !data.url) throw new Error(data.error || "Não foi possível enviar a foto.");
  await updateProfile(user, { photoURL: data.url });
  return data.url;
}

export function accountError(error: unknown) {
  if (error instanceof FirebaseError) {
    const messages: Record<string, string> = {
      "auth/invalid-credential": "A senha atual está incorreta.",
      "auth/wrong-password": "A senha atual está incorreta.",
      "auth/weak-password": "A nova senha precisa ter pelo menos 6 caracteres.",
      "auth/email-already-in-use": "Este e-mail já está em uso.",
      "auth/requires-recent-login": "Entre novamente e tente outra vez.",
      "auth/invalid-email": "E-mail inválido.",
      "auth/user-not-found": "Nenhum acesso encontrado com este e-mail.",
      "auth/too-many-requests": "Muitas tentativas. Aguarde e tente de novo.",
    };
    return messages[error.code] || "Não foi possível salvar. Tente novamente.";
  }
  return error instanceof Error ? error.message : "Não foi possível salvar.";
}
