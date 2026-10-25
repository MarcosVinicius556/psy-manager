"use client";

import { useEffect, useState } from "react";
import ListCard from "@/components/admin/mobile/ListCard";
import { DataTable, Empty, MobileListGrid, PageTitle, ResponsiveTableWrap, Td, Th } from "@/components/admin/ui";
import { listAudit, type AuditEntry } from "@/lib/saas/platform-store";

export default function AuditPage() {
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listAudit()
      .then(setItems)
      .catch(() => setError("Não foi possível ler a auditoria."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageTitle title="Auditoria" subtitle="Ações do proprietário. O registro não guarda senha, token, cartão nem conteúdo de prontuário, e não pode ser editado pela aplicação." />
      {loading && <p className="text-muted">Carregando registros...</p>}
      {error && <p className="text-accent">{error}</p>}
      {!loading && items.length === 0 && <Empty>Nenhuma ação administrativa registrada.</Empty>}
      {items.length > 0 && (
        <>
          <MobileListGrid className="md:hidden">
            {items.map((item) => (
              <ListCard
                key={item.id}
                title={item.action}
                subtitle={item.summary}
                trailing={
                  <span className="text-xs text-muted">{item.at ? new Date(item.at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                }
              >
                <p className="mt-1 truncate text-xs text-muted">{item.actorEmail}</p>
              </ListCard>
            ))}
          </MobileListGrid>
          <ResponsiveTableWrap>
            <DataTable minWidth={760}>
              <thead>
                <tr>
                  <Th>Quando</Th>
                  <Th>Quem</Th>
                  <Th>Ação</Th>
                  <Th>Alvo</Th>
                  <Th>Resultado</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <Td>{item.at ? new Date(item.at).toLocaleString("pt-BR") : "—"}</Td>
                    <Td>{item.actorEmail}</Td>
                    <Td>{item.action}</Td>
                    <Td>{item.targetUid}</Td>
                    <Td>{item.summary}</Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </ResponsiveTableWrap>
        </>
      )}
    </div>
  );
}
