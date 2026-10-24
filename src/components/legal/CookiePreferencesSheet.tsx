"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Drawer from "@/components/admin/Drawer";

type Props = {
  open: boolean;
  onClose: () => void;
  initialFuncionais: boolean;
  initialAnaliticos: boolean;
  onSave: (funcionais: boolean, analiticos: boolean) => void;
};

export default function CookiePreferencesSheet({ open, onClose, initialFuncionais, initialAnaliticos, onSave }: Props) {
  const [funcionais, setFuncionais] = useState(initialFuncionais);
  const [analiticos, setAnaliticos] = useState(initialAnaliticos);

  useEffect(() => {
    if (open) {
      setFuncionais(initialFuncionais);
      setAnaliticos(initialAnaliticos);
    }
  }, [open, initialAnaliticos, initialFuncionais]);

  return (
    <Drawer
      open={open}
      title="Preferências de cookies"
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="h-11 flex-1 rounded-full bg-teal text-sm font-semibold text-white"
            onClick={() => onSave(funcionais, analiticos)}
            data-testid="cookie-save-preferences"
          >
            Salvar preferências
          </button>
          <button type="button" className="h-11 flex-1 rounded-full border border-[#d7e0d8] text-sm font-semibold text-teal" onClick={onClose}>
            Cancelar
          </button>
        </div>
      }
    >
      <div className="space-y-5 text-sm text-muted" data-testid="cookie-preferences-sheet">
        <p>
          Escolha quais categorias autoriza. Cookies necessários permanecem ativos para login e segurança. Detalhes em{" "}
          <Link href="/cookies" className="font-semibold text-teal underline underline-offset-2">/cookies</Link>.
        </p>
        <label className="flex items-start justify-between gap-4 rounded-2xl border border-[#e7eee8] p-4">
          <span>
            <span className="block font-semibold text-ink">Necessários</span>
            <span className="mt-1 block text-muted">Autenticação Firebase e registro da sua escolha de cookies.</span>
          </span>
          <input type="checkbox" checked disabled className="mt-1 size-5 accent-teal" aria-label="Necessários sempre ativos" />
        </label>
        <label className="flex items-start justify-between gap-4 rounded-2xl border border-[#e7eee8] p-4">
          <span>
            <span className="block font-semibold text-ink">Funcionais</span>
            <span className="mt-1 block text-muted">Menu recolhido e layout do painel.</span>
          </span>
          <input
            type="checkbox"
            className="mt-1 size-5 accent-teal"
            checked={funcionais}
            onChange={(event) => setFuncionais(event.target.checked)}
            aria-label="Cookies funcionais"
          />
        </label>
        <label className="flex items-start justify-between gap-4 rounded-2xl border border-[#e7eee8] p-4">
          <span>
            <span className="block font-semibold text-ink">Analíticos</span>
            <span className="mt-1 block text-muted">Medição agregada de uso (Google Analytics / Firebase Measurement), se configurado.</span>
          </span>
          <input
            type="checkbox"
            className="mt-1 size-5 accent-teal"
            checked={analiticos}
            onChange={(event) => setAnaliticos(event.target.checked)}
            aria-label="Cookies analíticos"
          />
        </label>
      </div>
    </Drawer>
  );
}
