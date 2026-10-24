"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HiOutlineShieldExclamation } from "react-icons/hi2";
import { useAuth } from "@/lib/admin/auth-context";
import { hasMfaEnrolled } from "@/lib/auth/mfa";

export default function MfaEncouragementBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [needsMfa, setNeedsMfa] = useState(false);

  useEffect(() => {
    if (!user) {
      setNeedsMfa(false);
      return;
    }
    setNeedsMfa(!hasMfaEnrolled(user));
  }, [user]);

  if (!needsMfa || dismissed) return null;

  return (
    <div className="mb-4 rounded-md border border-[#c9dfd1] bg-[#eef6f0] px-4 py-3 text-sm text-ink sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <HiOutlineShieldExclamation className="mt-0.5 shrink-0 text-xl text-teal" aria-hidden />
        <p className="leading-relaxed">
          <span className="font-semibold">Proteja a plataforma:</span> ative a verificação em duas etapas na área de
          configurações. Como proprietário, você administra contas sensíveis — o MFA reduz risco de acesso indevido.
        </p>
      </div>
      <div className="mt-3 flex shrink-0 flex-wrap gap-2 sm:mt-0">
        <Link href="/admin/configuracoes#seguranca" className="btn-primary min-h-11 px-4 py-2.5 text-sm">
          Ativar MFA
        </Link>
        <button type="button" className="btn-text min-h-11" onClick={() => setDismissed(true)}>
          Agora não
        </button>
      </div>
    </div>
  );
}
