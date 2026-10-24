"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import {
  MdCode,
  MdFormatBold,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdFormatSize,
  MdImage,
  MdLink,
  MdRedo,
  MdStrikethroughS,
  MdTableChart,
  MdUndo,
} from "react-icons/md";
import { uploadClinicFile } from "@/lib/admin/attachments";
import {
  CONTRACT_FIELDS,
  CONTRACT_FIELD_TOKEN,
  parseContract,
  type ContractBlock,
  type TextRun,
} from "@/lib/admin/contract";
import { fieldClass } from "./ui";

const groups = ["Paciente", "Profissional", "Data"] as const;

function PlaceholderText({ text }: { text: string }) {
  const parts = text.split(/(\{\{[^{}]+\}\})/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("{{") && part.endsWith("}}") ? (
          <span key={index} className="rounded-sm bg-sky-soft px-1 font-medium text-teal">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}

function Runs({ runs }: { runs: TextRun[] }) {
  if (runs.length === 0) return null;
  return (
    <>
      {runs.map((run, index) => {
        if (run.image) {
          return (
            <img key={index} src={run.image} alt={run.text || "Imagem"} className="my-2 max-h-40 max-w-full rounded-md" />
          );
        }
        const className = [
          run.bold ? "font-semibold" : "",
          run.italic ? "italic" : "",
          run.strike ? "line-through" : "",
          run.code ? "rounded-sm bg-white px-1 font-mono text-[0.85em]" : "",
          run.href ? "text-teal underline" : "",
        ]
          .filter(Boolean)
          .join(" ");
        const content = <PlaceholderText text={run.text} />;
        if (run.href) {
          return (
            <a key={index} href={run.href} className={className} target="_blank" rel="noreferrer">
              {content}
            </a>
          );
        }
        return (
          <span key={index} className={className || undefined}>
            {content}
          </span>
        );
      })}
    </>
  );
}

function PreviewBlock({ block }: { block: ContractBlock }) {
  if (block.type === "space") return <div className="h-2" />;
  if (block.type === "rule") return <hr className="border-[#d7e0d8]" />;
  if (block.type === "image") {
    return <img src={block.url} alt={block.alt || "Imagem"} className="my-2 max-h-48 max-w-full rounded-md" />;
  }
  if (block.type === "code") {
    return <pre className="overflow-x-auto rounded-md bg-white px-3 py-2 font-mono text-xs text-ink">{block.text || " "}</pre>;
  }
  if (block.type === "quote") {
    return (
      <blockquote className="border-l-4 border-teal pl-3 text-muted">
        <Runs runs={block.runs} />
      </blockquote>
    );
  }
  if (block.type === "table") {
    const rows = [block.headers, ...block.rows];
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => {
                  const Cell = rowIndex === 0 ? "th" : "td";
                  return (
                    <Cell key={cellIndex} className="border border-[#d7e0d8] px-2 py-1">
                      <Runs runs={cell} />
                    </Cell>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (block.type === "heading") {
    const className =
      block.level === 1
        ? "font-serif text-3xl font-medium text-teal"
        : block.level === 2
          ? "font-serif text-2xl font-medium text-teal"
          : "font-serif text-xl font-medium text-teal";
    const Tag = block.level === 1 ? "h3" : block.level === 2 ? "h4" : "h5";
    return (
      <Tag className={className}>
        <Runs runs={block.runs} />
      </Tag>
    );
  }
  if (block.type === "list") {
    const ListTag = block.ordered ? "ol" : "ul";
    return (
      <ListTag className={`grid gap-1 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}>
        {block.items.map((item, index) => (
          <li key={index} className="whitespace-pre-wrap">
            <Runs runs={item} />
          </li>
        ))}
      </ListTag>
    );
  }
  return (
    <p className="whitespace-pre-wrap">
      <Runs runs={block.runs} />
    </p>
  );
}

function ContractPreview({ markdown }: { markdown: string }) {
  const blocks = parseContract(markdown);
  if (blocks.length === 0) {
    return <p className="text-sm text-muted">A prévia aparece aqui conforme você escreve.</p>;
  }
  return (
    <div className="grid gap-2 text-sm leading-relaxed text-ink">
      {blocks.map((block, index) => (
        <PreviewBlock key={index} block={block} />
      ))}
    </div>
  );
}

function caretFromPoint(area: HTMLTextAreaElement, clientX: number, clientY: number) {
  const style = window.getComputedStyle(area);
  const mirror = document.createElement("div");
  const copied = [
    "boxSizing",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "letterSpacing",
    "lineHeight",
    "padding",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "border",
    "whiteSpace",
    "wordSpacing",
    "wordBreak",
    "overflowWrap",
  ] as const;
  copied.forEach((prop) => {
    mirror.style[prop] = style[prop];
  });
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  mirror.style.width = `${area.clientWidth}px`;
  document.body.appendChild(mirror);
  const text = area.value;
  const areaRect = area.getBoundingClientRect();
  const x = clientX - areaRect.left + area.scrollLeft;
  const y = clientY - areaRect.top + area.scrollTop;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    mirror.textContent = text.slice(0, mid);
    const marker = document.createElement("span");
    marker.textContent = text[mid] || ".";
    mirror.appendChild(marker);
    const markerRect = marker.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();
    const mx = markerRect.left - mirrorRect.left;
    const my = markerRect.top - mirrorRect.top;
    if (my < y - markerRect.height || (Math.abs(my - y) <= markerRect.height && mx <= x)) lo = mid;
    else hi = mid - 1;
    mirror.removeChild(marker);
  }
  document.body.removeChild(mirror);
  return Math.max(0, Math.min(text.length, lo));
}

function ToolButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-md text-white/90 transition-colors duration-200 hover:bg-white/15 disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function ContractEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<number>(0);
  const fromEditor = useRef(false);
  const [history, setHistory] = useState([value]);
  const [index, setIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (fromEditor.current) {
      fromEditor.current = false;
      return;
    }
    setHistory([value]);
    setIndex(0);
  }, [value]);

  function remember(next: string) {
    const stack = [...history.slice(0, index + 1), next].slice(-80);
    setHistory(stack);
    setIndex(stack.length - 1);
  }

  function setText(next: string, record: "now" | "type") {
    fromEditor.current = true;
    onChange(next);
    if (record === "now") {
      window.clearTimeout(typingTimer.current);
      remember(next);
      return;
    }
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => remember(next), 400);
  }

  function insertAt(start: number, end: number, insert: string, selectStart: number, selectEnd: number) {
    const area = areaRef.current;
    const next = value.slice(0, start) + insert + value.slice(end);
    setText(next, "now");
    requestAnimationFrame(() => {
      area?.focus();
      area?.setSelectionRange(selectStart, selectEnd);
    });
  }

  function insertToken(token: string, at?: number) {
    const area = areaRef.current;
    const start = at ?? area?.selectionStart ?? value.length;
    const end = at ?? area?.selectionEnd ?? start;
    insertAt(start, end, token, start, start + token.length);
  }

  function wrapSelection(before: string, after = before, fallback = "texto") {
    const area = areaRef.current;
    if (!area) return;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const insert = `${before}${selected}${after}`;
    insertAt(start, end, insert, start + before.length, start + before.length + selected.length);
  }

  function prefixLines(make: (line: string, index: number) => string, fallback = "item") {
    const area = areaRef.current;
    if (!area) return;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const insert = selected.split("\n").map(make).join("\n");
    insertAt(start, end, insert, start, start + insert.length);
  }

  function heading() {
    const area = areaRef.current;
    if (!area) return;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const inner = value.slice(start, end) || "Título";
    const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const prefix = value.slice(lineStart, start).trim() ? "\n\n## " : "## ";
    insertAt(start, end, `${prefix}${inner}`, start + prefix.length, start + prefix.length + inner.length);
  }

  function undo() {
    if (index === 0) return;
    const next = index - 1;
    setIndex(next);
    fromEditor.current = true;
    onChange(history[next]);
  }

  function redo() {
    if (index >= history.length - 1) return;
    const next = index + 1;
    setIndex(next);
    fromEditor.current = true;
    onChange(history[next]);
  }

  async function onPickImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadClinicFile(file, { kind: "contract-template" }, "foto");
      const alt = uploaded.nome.replace(/\.[^.]+$/, "") || "imagem";
      insertToken(`![${alt}](${uploaded.url})`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  const fieldGroups = useMemo(
    () =>
      groups.map((group) => ({
        group,
        items: CONTRACT_FIELDS.filter((item) => item.group === group),
      })),
    []
  );

  return (
    <div className="grid gap-4">
      <div className="rounded-md border border-[#e2e8ea] bg-paper p-4">
        <p className="text-sm font-medium text-ink">Campos do contrato</p>
        <p className="mt-1 text-sm text-muted">Arraste para o texto ou clique para inserir no cursor. Na emissão, cada campo vira o dado real.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {fieldGroups.map((group) => (
            <div key={group.group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal">{group.group}</p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => {
                  const token = CONTRACT_FIELD_TOKEN(item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      draggable
                      title={`Arraste ${token}`}
                      onClick={() => insertToken(token)}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", token);
                        event.dataTransfer.effectAllowed = "copy";
                      }}
                      className="cursor-grab rounded-md border border-[#d7e0d8] bg-white px-2.5 py-1.5 text-left text-sm text-teal active:cursor-grabbing"
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-[#e2e8ea]">
        <div className="flex flex-wrap items-center gap-0.5 bg-teal px-2 py-1.5">
          <ToolButton label="Desfazer" onClick={undo} disabled={index === 0}>
            <MdUndo size={18} />
          </ToolButton>
          <ToolButton label="Refazer" onClick={redo} disabled={index >= history.length - 1}>
            <MdRedo size={18} />
          </ToolButton>
          <span className="mx-1 h-5 w-px bg-white/20" />
          <ToolButton label="Negrito" onClick={() => wrapSelection("**")}>
            <MdFormatBold size={18} />
          </ToolButton>
          <ToolButton label="Itálico" onClick={() => wrapSelection("*")}>
            <MdFormatItalic size={18} />
          </ToolButton>
          <ToolButton label="Tachado" onClick={() => wrapSelection("~~")}>
            <MdStrikethroughS size={18} />
          </ToolButton>
          <ToolButton label="Título" onClick={heading}>
            <MdFormatSize size={18} />
          </ToolButton>
          <span className="mx-1 h-5 w-px bg-white/20" />
          <ToolButton label="Lista" onClick={() => prefixLines((line) => `- ${line || "item"}`)}>
            <MdFormatListBulleted size={18} />
          </ToolButton>
          <ToolButton label="Lista numerada" onClick={() => prefixLines((line, index) => `${index + 1}. ${line || "item"}`)}>
            <MdFormatListNumbered size={18} />
          </ToolButton>
          <ToolButton label="Citação" onClick={() => prefixLines((line) => `> ${line || "citação"}`, "citação")}>
            <MdFormatQuote size={18} />
          </ToolButton>
          <ToolButton label="Bloco de código" onClick={() => wrapSelection("```\n", "\n```", "código")}>
            <MdCode size={18} />
          </ToolButton>
          <ToolButton
            label="Tabela"
            onClick={() => insertToken("\n| Coluna 1 | Coluna 2 |\n| --- | --- |\n|  |  |\n")}
          >
            <MdTableChart size={18} />
          </ToolButton>
          <span className="mx-1 h-5 w-px bg-white/20" />
          <ToolButton label="Link" onClick={() => wrapSelection("[", "](https://)", "texto do link")}>
            <MdLink size={18} />
          </ToolButton>
          <ToolButton label="Imagem" onClick={() => imageRef.current?.click()} disabled={uploading}>
            <MdImage size={18} />
          </ToolButton>
          <input ref={imageRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onPickImage} />
        </div>
        <div className="grid lg:grid-cols-2">
          <textarea
            ref={areaRef}
            aria-label="Modelo do contrato"
            className={`${fieldClass} min-h-[32rem] resize-y rounded-none border-0 font-sans leading-relaxed lg:border-r lg:border-[#e2e8ea]`}
            value={value}
            spellCheck
            onChange={(event) => setText(event.target.value, "type")}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }}
            onDrop={(event) => {
              event.preventDefault();
              const token = event.dataTransfer.getData("text/plain");
              if (!token) return;
              const area = areaRef.current;
              if (!area) return;
              insertToken(token, caretFromPoint(area, event.clientX, event.clientY));
            }}
          />
          <div aria-label="Prévia do contrato" className="min-h-[32rem] overflow-auto bg-paper p-5 lg:max-h-[40rem]">
            <ContractPreview markdown={value} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContractEditor;
