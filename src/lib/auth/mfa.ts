import { FirebaseError } from "firebase/app";
import {
  multiFactor,
  TotpMultiFactorGenerator,
  type MultiFactorInfo,
  type TotpSecret,
  type User,
} from "firebase/auth";
import { MFA_ISSUER } from "./constants";

export function mfaErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    const messages: Record<string, string> = {
      "auth/operation-not-allowed":
        "A verificação em duas etapas ainda não está ativa neste projeto Firebase. O proprietário precisa habilitar MFA no console (veja docs/mfa.md).",
      "auth/unsupported-first-factor": "Esta conta precisa entrar com e-mail e senha antes de ativar o autenticador.",
      "auth/unverified-email": "Confirme o e-mail da conta antes de ativar a verificação em duas etapas.",
      "auth/invalid-verification-code": "Código inválido. Confira o aplicativo autenticador e tente de novo.",
      "auth/code-expired": "O código expirou. Gere um novo no aplicativo e tente outra vez.",
      "auth/requires-recent-login": "Por segurança, confirme sua senha novamente e tente outra vez.",
      "auth/second-factor-already-in-use": "Este segundo fator já está em uso em outra conta.",
      "auth/maximum-second-factor-count-exceeded": "Limite de fatores de autenticação atingido.",
      "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco e tente de novo.",
    };
    return messages[error.code] || "Não foi possível concluir a verificação em duas etapas.";
  }
  return error instanceof Error ? error.message : "Não foi possível concluir a verificação em duas etapas.";
}

export function isMfaProjectDisabled(error: unknown): boolean {
  return error instanceof FirebaseError && error.code === "auth/operation-not-allowed";
}

export function enrolledTotpFactors(user: User): MultiFactorInfo[] {
  return multiFactor(user).enrolledFactors.filter((factor) => factor.factorId === TotpMultiFactorGenerator.FACTOR_ID);
}

export function hasMfaEnrolled(user: User): boolean {
  return multiFactor(user).enrolledFactors.length > 0;
}

export async function beginTotpEnrollment(user: User): Promise<TotpSecret> {
  const session = await multiFactor(user).getSession();
  return TotpMultiFactorGenerator.generateSecret(session);
}

export function totpQrCodeUrl(secret: TotpSecret, accountEmail: string): string {
  return secret.generateQrCodeUrl(accountEmail, MFA_ISSUER);
}

export async function finishTotpEnrollment(user: User, secret: TotpSecret, verificationCode: string) {
  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, verificationCode.trim());
  await multiFactor(user).enroll(assertion, "Aplicativo autenticador");
}

export async function unenrollMfaFactor(user: User, factor: MultiFactorInfo) {
  await multiFactor(user).unenroll(factor);
}
