"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/lib/admin/auth-context";
import { useClinic } from "@/lib/admin/clinic-context";
import type { CareLocation, DirectoryUser } from "@/lib/admin/types";
import { Field, fieldClass } from "./ui";

export default function LocationForm({
  location,
  onSaved,
}: {
  location?: CareLocation;
  onSaved: (id: string) => void;
}) {
  const { user } = useAuth();
  const { members, locationInvites, saveLocation, lookupDirectoryUser, sendLocationInvite } = useClinic();
  const [nome, setNome] = useState(location?.nome ?? "");
  const [endereco, setEndereco] = useState(location?.endereco ?? "");
  const [observacoes, setObservacoes] = useState(location?.observacoes ?? "");
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<DirectoryUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState(false);
  const owner = !location || location.createdByUid === user?.uid;
  const me = members.find((member) => member.uid === user?.uid);
  const invites = locationInvites.filter((invite) => invite.locationId === location?.id);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const id = await saveLocation(
        {
          nome,
          endereco,
          observacoes,
          memberIds: location?.memberIds ?? [],
          memberUids: location?.memberUids ?? [],
        },
        location?.id
      );
      onSaved(id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o local.");
    } finally {
      setSaving(false);
    }
  }

  async function searchUser() {
    setSearching(true);
    setFound(null);
    try {
      const person = await lookupDirectoryUser(email);
      if (!person) {
        toast.error("Nenhum profissional com este e-mail está cadastrado na plataforma.");
        return;
      }
      if (person.uid === user?.uid) {
        toast.error("Este e-mail é o seu. O local já fica vinculado a quem o criou.");
        return;
      }
      setFound(person);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível buscar o profissional.");
    } finally {
      setSearching(false);
    }
  }

  async function invite() {
    if (!location || !found) return;
    setInviting(true);
    try {
      await sendLocationInvite(location.id, found);
      setFound(null);
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar o convite.");
    } finally {
      setInviting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Field label="Nome">
        <input className={fieldClass} value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Consultório Centro" required disabled={!owner} />
      </Field>
      <Field label="Endereço">
        <input className={fieldClass} value={endereco} onChange={(event) => setEndereco(event.target.value)} disabled={!owner} />
      </Field>
      <Field label="Observações">
        <textarea className={`${fieldClass} min-h-20`} value={observacoes} onChange={(event) => setObservacoes(event.target.value)} disabled={!owner} />
      </Field>
      <div className="rounded-md bg-paper px-4 py-3 text-sm">
        <p className="font-medium">Responsável pelo local</p>
        <p>{me?.nome || "Você"}</p>
        <p className="text-muted">{me?.email || user?.email}</p>
      </div>
      {owner && (
        <button className="btn-primary" disabled={saving}>
          {saving ? "Salvando..." : location ? "Salvar local" : "Cadastrar local"}
        </button>
      )}
      {owner && location && (
        <div className="grid gap-3 rounded-md border border-leaf p-4">
          <p className="text-sm font-medium">Convidar outro profissional</p>
          <p className="text-sm text-muted">
            O convite só vincula o local, a agenda e as despesas depois que a outra pessoa aceitar.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              className={`${fieldClass} min-w-0 flex-1 sm:min-w-56`}
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFound(null);
              }}
              placeholder="email@exemplo.com"
            />
            <button type="button" className="btn-row" disabled={searching || !email.trim()} onClick={searchUser}>
              {searching ? "Buscando..." : "Buscar"}
            </button>
          </div>
          {found && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-paper px-4 py-3">
              <span>
                {found.nome}
                <small className="block text-muted">{found.email}</small>
              </span>
              <button type="button" className="btn-primary" disabled={inviting} onClick={invite}>
                {inviting ? "Enviando..." : "Enviar convite"}
              </button>
            </div>
          )}
          {invites.length > 0 && (
            <ul className="grid gap-2 text-sm">
              {invites.map((invite) => (
                <li key={invite.id} className="flex items-center justify-between gap-3">
                  <span>
                    {invite.inviteeNome}
                    <small className="block text-muted">{invite.inviteeEmail}</small>
                  </span>
                  <span className="text-muted">
                    {invite.status === "aceito" ? "Aceito" : invite.status === "recusado" ? "Recusado" : "Aguardando"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {owner && !location && (
        <p className="text-sm text-muted">Depois de cadastrar o local, você pode buscar um profissional pelo e-mail e enviar o convite.</p>
      )}
    </form>
  );
}
