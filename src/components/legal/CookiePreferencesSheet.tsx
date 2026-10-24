"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Drawer from "@/components/admin/Drawer";
import CookiePreferenceSwitch from "@/components/legal/CookiePreferenceSwitch";

type Props = {
  open: boolean;
  onClose: () => void;
  initialFuncionais: boolean;
  initialAnaliticos: boolean;
  onSave: (funcionais: boolean, analiticos: boolean) => void;
};

function PreferenceRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[#e7eee8] p-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-1 text-muted">{description}</p>
      </div>
      <div className="flex shrink-0 items-center pt-0.5">{control}</div>
    </div>
  );
}

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
      elevation="legal"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="btn-primary w-full flex-1 sm:w-auto"
            onClick={() => onSave(funcionais, analiticos)}
            data-testid="cookie-save-preferences"
          >
            Salvar preferências
          </button>
          <button type="button" className="btn-text w-full flex-1 sm:w-auto" onClick={onClose}>
            Cancelar
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-sm text-muted" data-testid="cookie-preferences-sheet">
        <p>
          Escolha quais categorias autoriza. Cookies necessários permanecem ativos para login e segurança. Detalhes em{" "}
          <Link href="/cookies" className="font-semibold text-teal underline underline-offset-2">/cookies</Link>.
        </p>
        <PreferenceRow
          title="Necessários"
          description="Autenticação Firebase e registro da sua escolha de cookies."
          control={<CookiePreferenceSwitch checked disabled label="Cookies necessários" />}
        />
        <PreferenceRow
          title="Funcionais"
          description="Menu recolhido e layout do painel."
          control={
            <CookiePreferenceSwitch
              checked={funcionais}
              label="Cookies funcionais"
              onChange={setFuncionais}
            />
          }
        />
        <PreferenceRow
          title="Analíticos"
          description="Medição agregada de uso (Google Analytics / Firebase Measurement), se configurado."
          control={
            <CookiePreferenceSwitch
              checked={analiticos}
              label="Cookies analíticos"
              onChange={setAnaliticos}
            />
          }
        />
      </div>
    </Drawer>
  );
}
