"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { Card, Empty, Field, PageTitle, fieldClass } from "@/components/admin/ui";
import { accountError, createAuthUser } from "@/lib/admin/account";
import { useAuth } from "@/lib/admin/auth-context";
import { provisionPsychologist } from "@/lib/admin/collections";

export default function UsersPage() {
  const { role, loading } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading) return <p className="text-muted">Carregando...</p>;
  if (role !== "super_admin") {
    return <Empty>Esta página só pode ser acessada por um super admin.</Empty>;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("A confirmação da senha não confere.");
      return;
    }
    setSaving(true);
    try {
      const uid = await createAuthUser(email, password, nome);
      try {
        await provisionPsychologist({ uid, nome, email });
      } catch (error) {
        console.error(error);
        toast.warn("O acesso foi criado. No primeiro login, o cadastro clínico é concluído.");
        setNome("");
        setEmail("");
        setPassword("");
        setConfirm("");
        return;
      }
      toast.success("Usuário cadastrado. A pessoa já pode entrar com este e-mail e senha.");
      setNome("");
      setEmail("");
      setPassword("");
      setConfirm("");
    } catch (error) {
      toast.error(accountError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageTitle
        title="Usuários"
        subtitle="Cadastro manual de profissionais. Estas contas entram como acesso anterior, sem trial de 30 dias. O cadastro público fica em Começar gratuitamente."
      />
      <Card>
        <form onSubmit={onSubmit} className="grid max-w-xl gap-4">
          <Field label="Nome">
            <input className={fieldClass} value={nome} onChange={(event) => setNome(event.target.value)} required />
          </Field>
          <Field label="E-mail">
            <input className={fieldClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </Field>
          <Field label="Senha">
            <input className={fieldClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
          </Field>
          <Field label="Confirmar senha">
            <input className={fieldClass} type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required minLength={6} />
          </Field>
          <button className="btn-primary justify-self-start" disabled={saving}>
            {saving ? "Cadastrando..." : "Cadastrar usuário"}
          </button>
        </form>
      </Card>
    </div>
  );
}
