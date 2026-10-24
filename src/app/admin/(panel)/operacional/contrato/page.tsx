"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { HiOutlineTrash } from "react-icons/hi";
import ListCard from "@/components/admin/mobile/ListCard";
import { Card, DataTable, Empty, MobileListGrid, PageTitle, ResponsiveTableWrap, Td, Th } from "@/components/admin/ui";
import { useAuth } from "@/lib/admin/auth-context";
import { useClinic } from "@/lib/admin/clinic-context";
import { listContractTemplates, removeContractTemplate, writeContractTemplate } from "@/lib/admin/collections";
import { formatDate } from "@/lib/admin/format";
import type { ContractTemplate } from "@/lib/admin/contract";

function formatWhen(iso: string) {
  const date = formatDate(iso.slice(0, 10));
  const time = iso.includes("T") ? iso.slice(11, 16) : "";
  return time ? `${date} às ${time}` : date;
}

export default function ContractTemplatesPage() {
  const { user } = useAuth();
  const { members } = useClinic();
  const me = members.find((member) => member.uid === user?.uid || member.email === user?.email?.toLowerCase());
  const [items, setItems] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const refresh = useCallback(async () => {
    setItems(await listContractTemplates());
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await refresh();
      } catch (error) {
        console.error(error);
        if (active) toast.error("Não foi possível carregar os modelos de contrato.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  async function importLegacy() {
    const conteudo = me?.contratoModelo?.trim();
    if (!conteudo) return;
    setImporting(true);
    try {
      await writeContractTemplate({ nome: "Modelo principal", conteudo });
      toast.success("Modelo antigo importado.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível importar o modelo.");
    } finally {
      setImporting(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir este modelo de contrato?")) return;
    try {
      await removeContractTemplate(id);
      toast.success("Modelo excluído.");
      await refresh();
    } catch (error) {
      toast.error("Não foi possível excluir o modelo.");
    }
  }

  return (
    <div>
      <PageTitle
        title="Modelos de contrato"
        subtitle="Cadastre e versione os textos. Na ficha do paciente você escolhe qual modelo gerar."
        action={
          <Link href="/admin/operacional/contrato/novo" className="btn-primary">
            Novo modelo
          </Link>
        }
      />
      <Card>
        {loading ? (
          <p className="text-muted">Carregando modelos...</p>
        ) : items.length === 0 ? (
          <div className="grid gap-4">
            <Empty>Nenhum modelo cadastrado ainda.</Empty>
            {me?.contratoModelo?.trim() ? (
              <button type="button" className="btn-text justify-self-start" disabled={importing} onClick={() => void importLegacy()}>
                {importing ? "Importando..." : "Importar o modelo antigo"}
              </button>
            ) : null}
          </div>
        ) : (
          <>
          <MobileListGrid>
            {items.map((item) => (
              <ListCard
                key={item.id}
                href={`/admin/operacional/contrato/${item.id}`}
                title={item.nome}
                subtitle={`Versão v${item.versao} · ${formatWhen(item.updatedAt)}`}
              />
            ))}
          </MobileListGrid>
          <ResponsiveTableWrap>
          <DataTable minWidth={720}>
            <thead>
              <tr>
                <Th>Modelo</Th>
                <Th>Versão</Th>
                <Th>Atualizado</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <Td>
                    <Link href={`/admin/operacional/contrato/${item.id}`} className="font-medium text-teal">
                      {item.nome}
                    </Link>
                  </Td>
                  <Td>v{item.versao}</Td>
                  <Td>{formatWhen(item.updatedAt)}</Td>
                  <Td>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link href={`/admin/operacional/contrato/${item.id}`} className="btn-chip">
                        Editar
                      </Link>
                      <button type="button" className="btn-text text-accent" onClick={() => void remove(item.id)} aria-label={`Excluir ${item.nome}`}>
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
