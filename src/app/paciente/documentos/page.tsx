"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { patientFetch } from "@/lib/patient/api";

export default function PatientDocumentsPage() {
  const [pending, setPending] = useState<{ kind: string; token: string; title: string }[]>([]);
  const [receipts, setReceipts] = useState<{ paymentId: string; descricao: string; numero: number; emitidoEm: string }[]>([]);

  useEffect(() => {
    void patientFetch("/api/patient/documents").then((data) => {
      setPending(data.pending as typeof pending);
      setReceipts(data.receipts as typeof receipts);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium text-teal">Documentos</h1>
      <section>
        <h2 className="mb-2 font-medium">Pendentes</h2>
        <ul className="space-y-2 text-sm">
          {pending.map((item) => (
            <li key={item.token}>
              <Link
                className="text-teal underline"
                href={item.kind === "assinatura" ? `/assinar/${item.token}` : `/formulario/${item.token}`}
              >
                {item.title}
              </Link>
            </li>
          ))}
          {pending.length === 0 && <p className="text-muted">Nada pendente.</p>}
        </ul>
      </section>
      <section>
        <h2 className="mb-2 font-medium">Recibos emitidos</h2>
        <ul className="space-y-2 text-sm text-muted">
          {receipts.map((r) => (
            <li key={r.paymentId}>#{r.numero} · {r.descricao} · {r.emitidoEm.slice(0, 10)}</li>
          ))}
          {receipts.length === 0 && <p>Nenhum recibo disponível.</p>}
        </ul>
      </section>
    </div>
  );
}
