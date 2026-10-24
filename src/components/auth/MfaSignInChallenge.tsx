"use client";

import { useMemo, useState } from "react";
import {
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  TotpMultiFactorGenerator,
  type MultiFactorResolver,
} from "firebase/auth";
import { fieldClass } from "@/components/admin/ui";
import { getFirebaseAuth } from "@/lib/admin/firebase";
import { mfaErrorMessage } from "@/lib/auth/mfa";

type Props = {
  resolver: MultiFactorResolver;
  onCancel: () => void;
  onSuccess: () => void;
};

export default function MfaSignInChallenge({ resolver, onCancel, onSuccess }: Props) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);

  const totpHint = useMemo(
    () => resolver.hints.find((hint) => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID),
    [resolver.hints],
  );
  const phoneHint = useMemo(
    () => resolver.hints.find((hint) => hint.factorId === PhoneMultiFactorGenerator.FACTOR_ID),
    [resolver.hints],
  );

  async function verifyTotp() {
    if (!totpHint) return;
    setSubmitting(true);
    setMessage("");
    try {
      const assertion = TotpMultiFactorGenerator.assertionForSignIn(totpHint.uid, code.trim());
      await resolver.resolveSignIn(assertion);
      onSuccess();
    } catch (error) {
      setMessage(mfaErrorMessage(error));
      setSubmitting(false);
    }
  }

  async function sendSms() {
    if (!phoneHint) return;
    setSmsSending(true);
    setMessage("");
    try {
      const auth = getFirebaseAuth();
      const recaptcha = new RecaptchaVerifier(auth, "mfa-recaptcha", { size: "invisible" });
      const phoneInfoOptions = {
        multiFactorHint: phoneHint,
        session: resolver.session,
      };
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const id = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptcha);
      setVerificationId(id);
    } catch (error) {
      setMessage(mfaErrorMessage(error));
    } finally {
      setSmsSending(false);
    }
  }

  async function verifySms() {
    if (!verificationId) return;
    setSubmitting(true);
    setMessage("");
    try {
      const cred = PhoneAuthProvider.credential(verificationId, code.trim());
      const assertion = PhoneMultiFactorGenerator.assertion(cred);
      await resolver.resolveSignIn(assertion);
      onSuccess();
    } catch (error) {
      setMessage(mfaErrorMessage(error));
      setSubmitting(false);
    }
  }

  const usingSms = Boolean(verificationId || (!totpHint && phoneHint));
  const canSubmit = code.trim().length >= 6;

  return (
    <div className="mt-4 rounded-2xl border border-[#d7e0d8] bg-[#f6f7f5] p-4 sm:p-5">
      <p className="text-sm font-semibold text-teal">Verificação em duas etapas</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {totpHint
          ? "Abra o aplicativo autenticador e informe o código de 6 dígitos."
          : "Enviamos um código por SMS para o número cadastrado."}
      </p>

      <label className="mt-4 block text-sm font-medium text-ink" htmlFor="mfa-code">
        Código
      </label>
      <input
        id="mfa-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        className={`${fieldClass} mt-1`}
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="000000"
      />

      {message && <p className="mt-3 text-sm text-accent" role="alert">{message}</p>}

      <div id="mfa-recaptcha" className="sr-only" aria-hidden="true" />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          className="btn-primary min-h-11 w-full sm:w-auto"
          disabled={submitting || !canSubmit || (usingSms && !verificationId && !totpHint)}
          onClick={() => (usingSms ? verifySms() : verifyTotp())}
        >
          {submitting ? "Verificando..." : "Confirmar código"}
        </button>
        {phoneHint && !verificationId && (
          <button
            type="button"
            className="btn-text min-h-11"
            disabled={smsSending}
            onClick={() => sendSms()}
          >
            {smsSending ? "Enviando SMS..." : totpHint ? "Usar SMS em vez do app" : "Enviar SMS"}
          </button>
        )}
        <button type="button" className="btn-text min-h-11" onClick={onCancel} disabled={submitting}>
          Voltar
        </button>
      </div>

      {totpHint && phoneHint && !verificationId && (
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Prefira o aplicativo autenticador. O SMS só é oferecido quando o app não estiver disponível.
        </p>
      )}
    </div>
  );
}
