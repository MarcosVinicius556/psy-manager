"use client";

import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { uploadClinicFile, type AttachmentKind, type ClinicUploadTarget } from "@/lib/admin/attachments";
import type { ClinicAttachment } from "@/lib/admin/types";
import { Field } from "./ui";

export default function FileAttachments({
  label,
  description,
  files,
  onChange,
  uploadTarget,
  kind,
  multiple = true,
  disabled = false,
  onBusy,
}: {
  label: string;
  description: string;
  files: ClinicAttachment[];
  onChange: (files: ClinicAttachment[]) => void;
  uploadTarget: ClinicUploadTarget;
  kind: AttachmentKind;
  multiple?: boolean;
  disabled?: boolean;
  onBusy?: (busy: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef(files);
  filesRef.current = files;
  const [uploading, setUploading] = useState(false);
  const accept = kind === "foto" ? "image/png,image/jpeg,image/webp" : "image/png,image/jpeg,image/webp,application/pdf";

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selected.length === 0) return;
    const batch = multiple ? selected : selected.slice(0, 1);
    setUploading(true);
    onBusy?.(true);
    const accepted: ClinicAttachment[] = [];
    try {
      for (const file of batch) {
        try {
          accepted.push(await uploadClinicFile(file, uploadTarget, kind));
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Não foi possível enviar o arquivo.");
        }
      }
      if (accepted.length === 0) return;
      onChange(multiple ? [...filesRef.current, ...accepted] : accepted);
    } finally {
      setUploading(false);
      onBusy?.(false);
    }
  }

  function remove(id: string) {
    onChange(files.filter((file) => file.id !== id));
  }

  return (
    <Field label={label}>
      <p className="mb-3 text-sm text-muted">{description}</p>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={onPick} />
      {files.length === 0 ? (
        <p className="mb-3 text-sm text-muted">Nenhum arquivo anexado.</p>
      ) : (
        <ul className="mb-3 grid gap-2">
          {files.map((file) => (
            <li key={file.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-paper px-3 py-2">
              <a href={file.url} target="_blank" rel="noreferrer" className="font-medium text-teal">
                {file.nome}
              </a>
              {!disabled && (
                <button type="button" className="btn-text" disabled={uploading} onClick={() => remove(file.id)}>
                  Remover
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!disabled && (
        <button type="button" className="btn-text" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? "Enviando..." : multiple || files.length === 0 ? "Anexar arquivo" : "Trocar arquivo"}
        </button>
      )}
    </Field>
  );
}

export function ReceiptLinks({ files, align = "end" }: { files: ClinicAttachment[]; align?: "start" | "end" }) {
  if (files.length === 0) return null;
  return (
    <div className={`flex flex-col gap-1 ${align === "end" ? "items-end" : "items-start"}`}>
      {files.map((file) => (
        <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-teal">
          {files.length > 1 ? file.nome : "Comprovante"}
        </a>
      ))}
    </div>
  );
}
