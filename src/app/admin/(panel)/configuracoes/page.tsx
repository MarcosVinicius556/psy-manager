"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import Avatar from "@/components/admin/Avatar";
import Drawer from "@/components/admin/Drawer";
import { Card, PageTitle, Field, fieldClass } from "@/components/admin/ui";
import { accountError, changePassword, uploadAvatar } from "@/lib/admin/account";
import { useAuth } from "@/lib/admin/auth-context";
import { useClinic } from "@/lib/admin/clinic-context";
import { moneyInput, parseMoney, WEEKDAY_OPTIONS } from "@/lib/admin/format";
import { maskPhone } from "@/lib/masks";
import { shiftsToSlotKeys, slotKeysToShifts, timelineSlots } from "@/lib/admin/schedule";

const dangerButton =
  "inline-flex cursor-pointer items-center justify-center rounded-md border border-[#a01f1f] bg-[#a01f1f] px-5 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-transparent hover:text-[#a01f1f] disabled:cursor-not-allowed disabled:opacity-60";

export default function SettingsPage() {
  const { user, sendPasswordReset } = useAuth();
  const { members, loading, saveOwnProfile } = useClinic();
  const fileRef = useRef<HTMLInputElement>(null);
  const me = members.find((member) => member.uid === user?.uid || member.email === user?.email?.toLowerCase());
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [foto, setFoto] = useState("");
  const [valorBase, setValorBase] = useState("");
  const [valorSocial, setValorSocial] = useState("");
  const [openSlots, setOpenSlots] = useState<string[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingValues, setSavingValues] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);

  const email = user?.email || me?.email || "";

  useEffect(() => {
    if (!me && !user) return;
    setNome(me?.nome || user?.displayName || "");
    setTelefone(maskPhone(me?.telefone || ""));
    setFoto(me?.foto || user?.photoURL || "");
    setValorBase(moneyInput(me?.valorBase || 0));
    setValorSocial(moneyInput(me?.valorSocial || 0));
    setOpenSlots(shiftsToSlotKeys(me?.workHours || []));
  }, [me, user]);

  const hours = timelineSlots();
  const enabled = new Set(openSlots);

  function profilePayload(nextFoto = foto) {
    return {
      nome: nome || me?.nome || "Profissional",
      telefone,
      foto: nextFoto,
      valorBase: parseMoney(valorBase),
      valorSocial: parseMoney(valorSocial),
      workHours: slotKeysToShifts(openSlots),
    };
  }

  function toggleSlot(key: string) {
    setOpenSlots((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  function closePassword() {
    setPasswordOpen(false);
    setCurrentPassword("");
    setNextPassword("");
    setConfirmPassword("");
  }

  async function onProfile(event: React.FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await saveOwnProfile(profilePayload());
    } catch (error) {
      toast.error(accountError(error));
    } finally {
      setSavingProfile(false);
    }
  }

  async function onPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Escolha uma imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A foto precisa ter no máximo 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      setFoto(url);
      await saveOwnProfile(profilePayload(url));
    } catch (error) {
      toast.error(accountError(error));
    } finally {
      setUploading(false);
    }
  }

  async function onValues(event: React.FormEvent) {
    event.preventDefault();
    setSavingValues(true);
    try {
      await saveOwnProfile(profilePayload());
    } catch (error) {
      toast.error(accountError(error));
    } finally {
      setSavingValues(false);
    }
  }

  async function onHours(event: React.FormEvent) {
    event.preventDefault();
    setSavingHours(true);
    try {
      await saveOwnProfile(profilePayload());
      setHoursOpen(false);
    } catch (error) {
      toast.error(accountError(error));
    } finally {
      setSavingHours(false);
    }
  }

  useEffect(() => {
    if (!hoursOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setHoursOpen(false);
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [hoursOpen]);

  async function onPassword(event: React.FormEvent) {
    event.preventDefault();
    if (nextPassword.length < 6) {
      toast.error("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (nextPassword !== confirmPassword) {
      toast.error("A confirmação não coincide com a nova senha.");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, nextPassword);
      closePassword();
      toast.success("Senha alterada.");
    } catch (error) {
      toast.error(accountError(error));
    } finally {
      setSavingPassword(false);
    }
  }

  async function onForgot() {
    if (!email) {
      toast.error("Não há e-mail vinculado a este acesso.");
      return;
    }
    setSendingReset(true);
    try {
      await sendPasswordReset(email);
      toast.success(`Enviamos um link para redefinir a senha em ${email}.`);
    } catch (error) {
      toast.error(accountError(error));
    } finally {
      setSendingReset(false);
    }
  }

  if (loading) return <p className="text-muted">Carregando configurações...</p>;

  return (
    <div>
      <PageTitle title="Configurações" subtitle="Seus dados de acesso e a foto usada no painel." />
      <Card className="overflow-hidden p-0">
        <div className="bg-teal px-6 pb-10 pt-8 text-white sm:px-8">
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative">
              <Avatar name={nome || "Profissional"} src={foto} size={112} light />
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onPhoto} />
              <button
                type="button"
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white bg-white px-3 py-1.5 text-xs font-semibold text-teal transition-colors duration-300 hover:bg-transparent hover:text-white disabled:opacity-60"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? "Enviando..." : "Alterar foto"}
              </button>
            </div>
            <div className="min-w-0 pt-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Seu perfil</p>
              <h2 className="mt-1 truncate font-serif text-4xl font-medium">{nome || "Seu nome"}</h2>
              <p className="mt-2 text-sm text-white/80">{telefone || "Telefone ainda não informado"}</p>
            </div>
          </div>
        </div>
        <form onSubmit={onProfile} className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          <Field label="Nome">
            <input className={fieldClass} value={nome} onChange={(event) => setNome(event.target.value)} required />
          </Field>
          <Field label="Telefone">
            <input
              className={fieldClass}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={telefone}
              onChange={(event) => setTelefone(maskPhone(event.target.value))}
              placeholder="(00) 00000-0000"
            />
          </Field>
          <p className="text-sm text-muted sm:col-span-2">PNG, JPG ou WebP, até 5 MB. A foto aparece no menu do painel.</p>
          <button className="btn-primary justify-self-start" disabled={savingProfile}>
            {savingProfile ? "Salvando..." : "Salvar cadastro"}
          </button>
        </form>
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-medium text-teal">Valores da consulta</h2>
        <p className="mt-2 text-sm text-muted">O valor base entra no agendamento. O valor social entra quando a sessão é marcada como social.</p>
        <form onSubmit={onValues} className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Valor base da consulta">
            <input
              className={fieldClass}
              inputMode="decimal"
              value={valorBase}
              onChange={(event) => setValorBase(event.target.value)}
              placeholder="0,00"
            />
          </Field>
          <Field label="Valor social">
            <input
              className={fieldClass}
              inputMode="decimal"
              value={valorSocial}
              onChange={(event) => setValorSocial(event.target.value)}
              placeholder="0,00"
            />
          </Field>
          <button className="btn-primary justify-self-start" disabled={savingValues}>
            {savingValues ? "Salvando..." : "Salvar valores"}
          </button>
        </form>
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-medium text-teal">Horários de atendimento</h2>
        <p className="mt-2 text-sm text-muted">
          A agenda só oferece os horários marcados. Sem nenhum marcado, permanece das 7h às 21h.
        </p>
        <p className="mt-3 text-sm text-ink">
          {openSlots.length === 0
            ? "Nenhum horário marcado."
            : `${openSlots.length} ${openSlots.length === 1 ? "horário marcado" : "horários marcados"}.`}
        </p>
        <button type="button" className="btn-primary mt-5" onClick={() => setHoursOpen(true)}>
          Definir horário de trabalho
        </button>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-2xl font-medium text-teal">E-mail de acesso</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Este e-mail vincula você ao login. Ele não pode ser alterado por aqui.
          </p>
          <div className="mt-4">
            <Field label="E-mail">
              <input type="email" className={`${fieldClass} bg-paper text-muted`} value={email} disabled />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-medium text-teal">Senha</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            A senha só é alterada depois da sua confirmação. Se você não lembrar da atual, dá para receber um link no e-mail de acesso.
          </p>
          <button type="button" className={`${dangerButton} mt-5`} onClick={() => setConfirmOpen(true)}>
            Alterar senha
          </button>
        </Card>
      </div>

      {hoursOpen &&
        createPortal(
          <div className="sheet-host fixed inset-0 z-[90] grid place-items-center bg-ink/40 p-4">
            <div
              className="sheet-panel flex max-h-[min(92vh,900px)] w-full max-w-5xl flex-col rounded-md bg-white p-4 shadow-[0_18px_50px_rgba(61,82,64,0.18)] sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="work-hours-title"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="work-hours-title" className="font-serif text-[clamp(1.5rem,5vw,1.875rem)] leading-tight text-teal">
                    Horários de atendimento
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    Clique em um horário para habilitar ou desabilitar. A agenda só oferece os horários marcados.
                  </p>
                </div>
                <button type="button" className="btn-text shrink-0" onClick={() => setHoursOpen(false)} disabled={savingHours}>
                  Fechar
                </button>
              </div>
              <form onSubmit={onHours} className="mt-5 flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-auto">
                  <table className="w-full min-w-[760px] border-separate border-spacing-1">
                    <thead>
                      <tr>
                        <th className="sticky left-0 top-0 z-10 rounded-md bg-teal px-3 py-2 text-left text-xs font-semibold text-white">
                          Horário
                        </th>
                        {WEEKDAY_OPTIONS.map((day) => (
                          <th
                            key={day.value}
                            className="sticky top-0 z-10 rounded-md bg-teal px-2 py-2 text-center text-xs font-semibold text-white"
                          >
                            {day.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {hours.map((time) => (
                        <tr key={time}>
                          <th className="sticky left-0 rounded-md bg-sky-soft px-3 py-1 text-left text-xs font-semibold text-teal">
                            {time}
                          </th>
                          {WEEKDAY_OPTIONS.map((day) => {
                            const key = `${day.value}|${time}`;
                            const on = enabled.has(key);
                            return (
                              <td key={key}>
                                <button
                                  type="button"
                                  aria-pressed={on}
                                  aria-label={`${day.label} ${time}`}
                                  onClick={() => toggleSlot(key)}
                                  className={`h-11 w-full rounded-md border transition-colors duration-300 sm:h-8 ${
                                    on
                                      ? "border-teal bg-teal hover:bg-transparent"
                                      : "border-[#d7e0d8] bg-white hover:border-teal hover:bg-sky-soft"
                                  }`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 rounded-md border border-teal bg-teal" />
                      Atende
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 rounded-md border border-[#d7e0d8] bg-white" />
                      Não atende
                    </span>
                  </div>
                  <button className="btn-primary" disabled={savingHours}>
                    {savingHours ? "Salvando..." : "Salvar horários"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {confirmOpen &&
        createPortal(
          <div className="sheet-host fixed inset-0 z-[90] grid place-items-center bg-ink/40 p-4">
            <div className="sheet-panel w-full max-w-md rounded-md bg-white p-5 shadow-[0_18px_50px_rgba(61,82,64,0.18)] sm:p-6" role="dialog" aria-modal="true">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#a01f1f]">Senha</p>
              <h2 className="mt-2 font-serif text-[clamp(1.5rem,5vw,1.875rem)] leading-tight text-teal">Tem certeza?</h2>
              <p className="mt-3 leading-relaxed text-muted">
                A senha atual deixa de valer assim que a nova for salva. Deseja continuar com a alteração?
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className={dangerButton}
                  onClick={() => {
                    setConfirmOpen(false);
                    setPasswordOpen(true);
                  }}
                >
                  Sim, alterar senha
                </button>
                <button type="button" className="btn-text" onClick={() => setConfirmOpen(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <Drawer open={passwordOpen} title="Alterar senha" onClose={closePassword}>
        <form onSubmit={onPassword} className="grid gap-4">
          <p className="text-sm leading-relaxed text-muted">
            Informe a senha atual e escolha a nova. Ela precisa ter pelo menos 6 caracteres.
          </p>
          <Field label="Senha atual">
            <input
              type="password"
              className={fieldClass}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>
          <Field label="Nova senha">
            <input
              type="password"
              className={fieldClass}
              value={nextPassword}
              onChange={(event) => setNextPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
          <Field label="Confirmar nova senha">
            <input
              type="password"
              className={fieldClass}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
          <button className="btn-primary justify-self-start" disabled={savingPassword}>
            {savingPassword ? "Salvando..." : "Salvar nova senha"}
          </button>
          <div className="mt-2 border-t border-[#e7eee8] pt-4">
            <p className="text-sm leading-relaxed text-muted">
              Não lembra a senha atual? Enviamos um link de redefinição do Firebase para {email || "o e-mail deste acesso"}.
            </p>
            <button
              type="button"
              className="mt-3 inline-flex items-center justify-center rounded-md border border-teal bg-teal px-4 py-2 text-sm font-semibold text-white transition-colors duration-300 hover:bg-transparent hover:text-teal disabled:cursor-not-allowed disabled:opacity-60"
              disabled={sendingReset || !email}
              onClick={onForgot}
            >
              {sendingReset ? "Enviando..." : "Esqueci minha senha"}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
