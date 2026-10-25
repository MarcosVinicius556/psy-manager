"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { HiOutlineTrash } from "react-icons/hi";
import ListCard from "@/components/admin/mobile/ListCard";
import { Card, DataTable, Empty, MobileListGrid, PageTitle, ResponsiveTableWrap, Td, Th } from "@/components/admin/ui";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import { formatDate } from "@/lib/admin/format";
import { listEmailTemplates, setEmailTemplateArchived } from "@/lib/admin/collections";
import type { EmailTemplate } from "@/lib/email-integration/types";

function formatWhen(iso: string) {
  const date = formatDate(iso.slice(0, 10));
  const time = iso.includes("T") ? iso.slice(11, 16) : "";
  return time ? `${date} às ${time}` : date;
}

const TRIGGER_LABEL: Record<string, string> = {
  confirmacao_pagamento: "Confirmação de pagamento",
  copia_contrato: "Cópia do contrato",
  envio_recibo: "Recibo",
  lembrete_sessao: "Lembrete de sessão",
  link_avaliacao: "Link de avaliação",
  livre: "Livre",
};

export default function EmailTemplatesPage() {
  const [items, setItems] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const refresh = useCallback(async () => {
    setItems(await listEmailTemplates(true));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let list = await listEmailTemplates(true);
        if (list.length === 0) {
          setSeeding(true);
          const headers = await authorizedHeaders({ "Content-Type": "application/json" });
          await fetch("/api/email/templates/seed", { method: "POST", headers });
          list = await listEmailTemplates(true);
        }
        if (active) setItems(list);
      } catch (error) {
        console.error(error);
        if (active) toast.error("Não foi possível carregar os modelos de e-mail.");
      } finally {
        if (active) {
          setLoading(false);
          setSeeding(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function archive(id: string, arquivado: boolean) {
    try {
      await setEmailTemplateArchived(id, arquivado);
      toast.success(arquivado ? "Modelo arquivado." : "Modelo reativado.");
      await refresh();
    } catch {
      toast.error("Não foi possível atualizar o modelo.");
    }
  }

  const visible = items.filter((item) => !item.arquivado);

  return (
    <div>
      <PageTitle
        title="Modelos de e-mail"
        subtitle="Personalize mensagens para pacientes. O envio usa a conta Gmail configurada em Configurações."
        action={
          <Link href="/admin/operacional/email/novo" className="btn-primary">
            Novo modelo
          </Link>
        }
      />
      <Card>
        {loading || seeding ? (
          <p className="text-muted">{seeding ? "Preparando modelos padrão..." : "Carregando modelos..."}</p>
        ) : visible.length === 0 ? (
          <Empty>Nenhum modelo ativo. Crie um novo ou reative um arquivado.</Empty>
        ) : (
          <>
            <MobileListGrid>
              {visible.map((item) => (
                <ListCard
                  key={item.id}
                  href={`/admin/operacional/email/${item.id}`}
                  title={item.nome}
                  subtitle={`${TRIGGER_LABEL[item.trigger] || item.trigger} · v${item.versao}`}
                />
              ))}
            </MobileListGrid>
            <ResponsiveTableWrap>
              <DataTable minWidth={720}>
                <thead>
                  <tr>
                    <Th>Modelo</Th>
                    <Th>Gatilho</Th>
                    <Th>Versão</Th>
                    <Th>Atualizado</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => (
                    <tr key={item.id}>
                      <Td>
                        <Link href={`/admin/operacional/email/${item.id}`} className="font-medium text-teal">
                          {item.nome}
                        </Link>
                        {item.autoSend ? <span className="ml-2 text-xs text-muted">· auto</span> : null}
                      </Td>
                      <Td>{TRIGGER_LABEL[item.trigger] || item.trigger}</Td>
                      <Td>v{item.versao}</Td>
                      <Td>{formatWhen(item.updatedAt)}</Td>
                      <Td>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link href={`/admin/operacional/email/${item.id}`} className="btn-chip">
                            Editar
                          </Link>
                          <button
                            type="button"
                            className="btn-text text-accent"
                            onClick={() => void archive(item.id, true)}
                            aria-label={`Arquivar ${item.nome}`}
                          >
                            <HiOutlineTrash size={18} />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </ResponsiveTableWrap>
          </>
        )}
      </Card>
    </div>
  );
}
