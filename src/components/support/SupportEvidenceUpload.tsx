"use client";

import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { uploadClinicFile } from "@/lib/admin/attachments";
import type { SupportAttachmentMeta } from "@/lib/support/types";
import { validateAttachmentMeta } from "@/lib/support/attachments";

export default function SupportEvidenceUpload({
  ticketId,
  onUploaded,
}: {
  ticketId?: string;
  onUploaded: (items: SupportAttachmentMeta[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!ticketId) {
      toast.warn("Salve o chamado antes de enviar anexos.");
      return;
    }
    setBusy(true);
    const metas: SupportAttachmentMeta[] = [];
    try {
      for (const file of files) {
        const uploaded = await uploadClinicFile(file, { kind: "support-ticket", ticketId }, "documento");
        const meta: SupportAttachmentMeta = {
          id: uploaded.id,
          publicId: uploaded.asset?.publicId ?? "",
          mime: uploaded.mime ?? file.type,
          size: file.size,
          nome: uploaded.nome,
        };
        const err = validateAttachmentMeta(meta);
        if (err || !meta.publicId) {
          toast.error(err ?? "Falha no envio.");
          continue;
        }
        metas.push(meta);
      }
      if (metas.length) onUploaded(metas);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no envio.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,text/plain,.log,.zip,application/zip"
        className="hidden"
        onChange={(e) => void onPick(e)}
      />
      <button
        type="button"
        className="btn-secondary radius-control border border-leaf px-3 py-2 text-sm text-teal"
        disabled={busy || !ticketId}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Enviando..." : "Anexar evidências"}
      </button>
    </div>
  );
}
