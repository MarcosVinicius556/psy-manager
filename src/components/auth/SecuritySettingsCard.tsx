"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "react-toastify";
import Drawer from "@/components/admin/Drawer";
import { Card, Field, fieldClass } from "@/components/admin/ui";
import { reauthenticate } from "@/lib/admin/account";
import { useAuth } from "@/lib/admin/auth-context";
import {
  beginTotpEnrollment,
  enrolledTotpFactors,
  finishTotpEnrollment,
  hasMfaEnrolled,
  isMfaProjectDisabled,
  mfaErrorMessage,
  totpQrCodeUrl,
  unenrollMfaFactor,
} from "@/lib/auth/mfa";
import { sessionMetadataLines } from "@/lib/auth/session-metadata";
import type { TotpSecret } from "firebase/auth";

export default function SecuritySettingsCard() {
  const { user } = useAuth();
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [projectMfaDisabled, setProjectMfaDisabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  const meta = sessionMetadataLines(user);

  useEffect(() => {
    if (!user) {
      setMfaEnabled(false);
      return;
    }
    setMfaEnabled(hasMfaEnrolled(user));
  }, [user]);

  function closeEnroll() {
    setEnrollOpen(false);
    setVerificationCode("");
    setTotpSecret(null);
    setQrDataUrl("");
    setPassword("");
  }

  function closeDisable() {
    setDisableOpen(false);
    setPassword("");
  }

  async function startEnrollment() {
    if (!user) return;
    setBusy(true);
    setProjectMfaDisabled(false);
    try {
      await reauthenticate(password);
      const secret = await beginTotpEnrollment(user);
      const url = totpQrCodeUrl(secret, user.email || "conta");
      const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 220 });
      setTotpSecret(secret);
      setQrDataUrl(dataUrl);
      setEnrollOpen(true);
    } catch (error) {
      if (isMfaProjectDisabled(error)) {
        setProjectMfaDisabled(true);
        toast.error(mfaErrorMessage(error));
      } else {
        toast.error(mfaErrorMessage(error));
      }
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnrollment(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !totpSecret) return;
    setBusy(true);
    try {
      await finishTotpEnrollment(user, totpSecret, verificationCode);
      await user.reload();
      setMfaEnabled(hasMfaEnrolled(user));
      closeEnroll();
      toast.success("Verificação em duas etapas ativada.");
    } catch (error) {
      toast.error(mfaErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function disableMfa(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    const factors = enrolledTotpFactors(user);
    if (factors.length === 0) {
      setMfaEnabled(false);
      closeDisable();
      return;
    }
    setBusy(true);
    try {
      await reauthenticate(password);
      await unenrollMfaFactor(user, factors[0]);
      setMfaEnabled(false);
      closeDisable();
      toast.success("Verificação em duas etapas desativada.");
    } catch (error) {
      toast.error(mfaErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const providers = user?.providerData.map((item) => item.providerId) ?? [];
  const canUsePassword = providers.includes("password");

  return (
    <div id="seguranca" className="mt-6 scroll-mt-24">
    <Card>
      <h2 className="text-2xl font-medium text-teal">Segurança</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Proteja o acesso a dados sensíveis com verificação em duas etapas (TOTP) e controle de sessão por inatividade.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-[#e7eee8] bg-paper p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Sessões / último acesso</p>
          <p className="mt-2 text-sm text-ink">
            {meta.lastSignIn ? `Último login: ${meta.lastSignIn}` : "Último login indisponível."}
          </p>
          {meta.created && <p className="mt-1 text-xs text-muted">Conta criada em {meta.created}</p>}
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Após 30 minutos sem uso, pedimos confirmação antes de encerrar a sessão (exceto em links públicos de feedback).
          </p>
        </div>

        <div className="rounded-md border border-[#e7eee8] bg-paper p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Verificação em duas etapas</p>
          <p className="mt-2 text-sm text-ink">
            {mfaEnabled ? "Ativa — aplicativo autenticador" : "Desativada — recomendada para quem acessa prontuários."}
          </p>
          {projectMfaDisabled && (
            <p className="mt-2 text-sm leading-relaxed text-accent">
              O projeto Firebase ainda não liberou MFA. O proprietário deve habilitar no console (Identity Platform).
            </p>
          )}
          {!canUsePassword && (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Contas que entram só com Google precisam definir uma senha no Firebase ou usar outro fator suportado pelo provedor.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            {mfaEnabled ? (
              <button type="button" className="btn-text min-h-11" onClick={() => setDisableOpen(true)}>
                Desativar MFA
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary min-h-11"
                disabled={!canUsePassword || busy}
                onClick={() => {
                  setTotpSecret(null);
                  setQrDataUrl("");
                  setPassword("");
                  setEnrollOpen(true);
                }}
              >
                Ativar MFA
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-md border border-dashed border-[#d7e0d8] bg-white p-4 text-sm leading-relaxed text-muted">
        <p className="font-semibold text-ink">Recuperação</p>
        <p className="mt-2">
          Guarde o aplicativo autenticador em um dispositivo seguro. Se perder o acesso, use a recuperação de senha do
          e-mail cadastrado e, se necessário, peça ao suporte da clínica para revisar o acesso conforme a LGPD.
        </p>
      </div>

      <Drawer open={enrollOpen && !totpSecret} title="Ativar verificação em duas etapas" onClose={closeEnroll}>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            startEnrollment();
          }}
        >
          <p className="text-sm leading-relaxed text-muted">
            Confirme sua senha atual para gerar o QR code do aplicativo autenticador (Google Authenticator, Authy, etc.).
          </p>
          <Field label="Senha atual">
            <input
              type="password"
              className={fieldClass}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          <button className="btn-primary min-h-11 justify-self-start" disabled={busy || !password}>
            {busy ? "Gerando..." : "Continuar"}
          </button>
        </form>
      </Drawer>

      <Drawer open={enrollOpen && Boolean(totpSecret)} title="Escaneie o QR code" onClose={closeEnroll}>
        <form onSubmit={confirmEnrollment} className="grid gap-4">
          {qrDataUrl && (
            <img src={qrDataUrl} alt="QR code para o aplicativo autenticador" className="mx-auto max-w-full rounded-md border border-[#e7eee8] bg-white p-2" />
          )}
          <p className="text-sm leading-relaxed text-muted">
            Depois de escanear, digite o código de 6 dígitos exibido no app para concluir.
          </p>
          <Field label="Código do autenticador">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              className={fieldClass}
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
          </Field>
          <button className="btn-primary min-h-11 justify-self-start" disabled={busy || verificationCode.length < 6}>
            {busy ? "Ativando..." : "Confirmar e ativar"}
          </button>
        </form>
      </Drawer>

      <Drawer open={disableOpen} title="Desativar verificação em duas etapas" onClose={closeDisable}>
        <form onSubmit={disableMfa} className="grid gap-4">
          <p className="text-sm leading-relaxed text-muted">
            Por segurança, confirme sua senha. O login voltará a usar apenas e-mail e senha.
          </p>
          <Field label="Senha atual">
            <input
              type="password"
              className={fieldClass}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          <button className="btn-primary min-h-11 justify-self-start" disabled={busy || !password}>
            {busy ? "Salvando..." : "Desativar MFA"}
          </button>
        </form>
      </Drawer>
    </Card>
    </div>
  );
}
