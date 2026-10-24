import { formatDate, formatMoney, todayISO } from "./format";
import { maskCpf, maskPhone } from "../masks";
import type { Patient } from "./types";

export const CONTRACT_FIELDS = [
  { key: "paciente.nome", label: "Nome do paciente", group: "Paciente" },
  { key: "paciente.cpf", label: "CPF", group: "Paciente" },
  { key: "paciente.nascimento", label: "Nascimento", group: "Paciente" },
  { key: "paciente.telefone", label: "Telefone", group: "Paciente" },
  { key: "paciente.email", label: "E-mail", group: "Paciente" },
  { key: "paciente.endereco", label: "Endereço", group: "Paciente" },
  { key: "paciente.contatoEmergencia", label: "Contato de emergência", group: "Paciente" },
  { key: "profissional.nome", label: "Nome do profissional", group: "Profissional" },
  { key: "profissional.telefone", label: "Telefone do profissional", group: "Profissional" },
  { key: "profissional.email", label: "E-mail do profissional", group: "Profissional" },
  { key: "profissional.valorBase", label: "Valor da sessão", group: "Profissional" },
  { key: "profissional.valorSocial", label: "Valor social", group: "Profissional" },
  { key: "data.hoje", label: "Data de hoje", group: "Data" },
] as const;

export type ContractFieldKey = (typeof CONTRACT_FIELDS)[number]["key"];
export const CONTRACT_PLACEHOLDERS = CONTRACT_FIELDS.map((item) => item.key);
export const CONTRACT_FIELD_TOKEN = (key: string) => `{{${key}}}`;

const EMPTY_VALUE = "—";

export const DEFAULT_CONTRACT_TEMPLATE = `# Contrato de prestação de serviços de psicoterapia

Pelo presente instrumento particular, as partes abaixo identificadas firmam este contrato de atendimento psicológico.

## 1. Das partes

**Contratada:** {{profissional.nome}}, profissional de psicologia, telefone {{profissional.telefone}}, e-mail {{profissional.email}}.

**Contratante:** {{paciente.nome}}, inscrito(a) no CPF sob o nº {{paciente.cpf}}, nascido(a) em {{paciente.nascimento}}, telefone {{paciente.telefone}}, e-mail {{paciente.email}}, residente em {{paciente.endereco}}.

Contato de emergência: {{paciente.contatoEmergencia}}.

## 2. Do objeto

O objeto deste contrato é a prestação de serviços de psicoterapia ao contratante, em sessões individuais, na modalidade presencial ou online, conforme o agendamento combinado entre as partes.

O atendimento observa o Código de Ética Profissional do Psicólogo. Não substitui avaliação médica e não promete resultado terapêutico.

## 3. Das sessões e dos valores

Cada sessão tem duração habitual de 50 (cinquenta) minutos.

O valor de referência de cada sessão é {{profissional.valorBase}}. Quando houver acordo de valor social, o valor de cada sessão passa a ser {{profissional.valorSocial}}.

O pagamento é feito na forma e na data combinadas no agendamento. A falta sem aviso prévio mínimo de 24 (vinte e quatro) horas pode ser cobrada integralmente.

## 4. Da duração

Este contrato entra em vigor em {{data.hoje}} e permanece válido enquanto durar o acompanhamento.

Qualquer das partes pode encerrar o atendimento, de preferência com uma sessão de encerramento, mediante comunicação à outra parte.

## 5. Das responsabilidades

A contratada se compromete a reservar os horários agendados, a conduzir o atendimento com ética e sigilo e a guardar o registro clínico de forma reservada.

A contratante se compromete a comparecer nos horários marcados, a avisar impossibilidades com antecedência e a manter atualizados telefone, e-mail e endereço.

## 6. Da privacidade e do sigilo

As informações trazidas em sessão são sigilosas. A quebra de sigilo somente ocorre nas hipóteses previstas em lei e nas resoluções do Conselho Federal de Psicologia, inclusive risco à vida e determinação judicial.

Os dados de cadastro usados neste instrumento (nome, CPF, nascimento, telefone, e-mail e endereço) servem à identificação das partes e à organização do atendimento.

## 7. Das assinaturas

E, por estarem de acordo, as partes assinam este instrumento.

Local e data: ______________________________, {{data.hoje}}.

_________________________________
{{profissional.nome}}
Contratada

_________________________________
{{paciente.nome}}
Contratante
`;

export type ContractTemplateVersion = {
  id: string;
  versao: number;
  quando: string;
  resumo: string;
  nome: string;
  conteudo: string;
};

export type ContractTemplate = {
  id: string;
  nome: string;
  conteudo: string;
  versao: number;
  historico: ContractTemplateVersion[];
  createdAt: string;
  updatedAt: string;
};

export function contractVersionSummary(before: { nome: string; conteudo: string }, after: { nome: string; conteudo: string }) {
  const changes: string[] = [];
  if (before.nome !== after.nome) changes.push(`nome de "${before.nome}" para "${after.nome}"`);
  if (before.conteudo !== after.conteudo) changes.push("texto do contrato");
  return changes.join(" e ") || "Atualização";
}

export type ContractProfessional = {
  nome: string;
  telefone: string;
  email: string;
  valorBase: number;
  valorSocial: number;
};

export type TextRun = {
  text: string;
  bold: boolean;
  italic: boolean;
  strike?: boolean;
  code?: boolean;
  href?: string;
  image?: string;
};

export type ContractBlock =
  | { type: "heading"; level: 1 | 2 | 3; runs: TextRun[] }
  | { type: "paragraph"; runs: TextRun[] }
  | { type: "list"; ordered: boolean; items: TextRun[][] }
  | { type: "quote"; runs: TextRun[] }
  | { type: "code"; text: string }
  | { type: "table"; headers: TextRun[][]; rows: TextRun[][][] }
  | { type: "image"; alt: string; url: string }
  | { type: "rule" }
  | { type: "space" };

export function resolveContractTemplate(stored: string | null | undefined) {
  return stored && stored.trim() ? stored : DEFAULT_CONTRACT_TEMPLATE;
}

export function contractFieldValues(
  patient: Patient,
  professional: ContractProfessional | null,
  today = todayISO()
): Record<ContractFieldKey, string> {
  const money = (value: number) => (value > 0 ? formatMoney(value) : "");
  const phone = (value: string) => (value.trim() ? maskPhone(value) : "");
  return {
    "paciente.nome": patient.nome.trim(),
    "paciente.cpf": patient.cpf.trim() ? maskCpf(patient.cpf) : "",
    "paciente.nascimento": patient.nascimento.trim() ? formatDate(patient.nascimento) : "",
    "paciente.telefone": phone(patient.telefone),
    "paciente.email": patient.email.trim(),
    "paciente.endereco": patient.endereco.trim(),
    "paciente.contatoEmergencia": patient.contatoEmergencia.trim(),
    "profissional.nome": professional?.nome.trim() ?? "",
    "profissional.telefone": phone(professional?.telefone ?? ""),
    "profissional.email": professional?.email.trim() ?? "",
    "profissional.valorBase": money(professional?.valorBase ?? 0),
    "profissional.valorSocial": money(professional?.valorSocial ?? 0),
    "data.hoje": formatDate(today),
  };
}

export function fillContractTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{\s*([^{}\n]+?)\s*\}\}/g, (match, raw: string) => {
    const key = raw.trim();
    if (!Object.prototype.hasOwnProperty.call(values, key)) return match;
    const value = values[key];
    if (typeof value !== "string" || !value.trim()) return EMPTY_VALUE;
    return value.trim();
  });
}

function hasItalicCloser(source: string, from: number) {
  for (let index = from; index < source.length; index += 1) {
    if (source.startsWith("**", index)) {
      index += 1;
      continue;
    }
    if (source[index] === "*") return true;
  }
  return false;
}

function matchAt(source: string, index: number, pattern: RegExp) {
  const slice = source.slice(index);
  const match = pattern.exec(slice);
  return match && match.index === 0 ? match : null;
}

export function parseInlines(source: string): TextRun[] {
  const runs: TextRun[] = [];
  let index = 0;
  let buffer = "";
  let bold = false;
  let italic = false;
  let strike = false;

  function flush() {
    if (!buffer) return;
    runs.push({ text: buffer, bold, italic, strike });
    buffer = "";
  }

  while (index < source.length) {
    const image = matchAt(source, index, /^!\[([^\]]*)\]\(([^)]+)\)/);
    if (image) {
      flush();
      runs.push({ text: image[1], bold: false, italic: false, image: image[2] });
      index += image[0].length;
      continue;
    }
    const link = matchAt(source, index, /^\[([^\]]+)\]\(([^)]+)\)/);
    if (link) {
      flush();
      runs.push({ text: link[1], bold, italic, strike, href: link[2] });
      index += link[0].length;
      continue;
    }
    if (source[index] === "`") {
      const close = source.indexOf("`", index + 1);
      if (close !== -1) {
        flush();
        runs.push({ text: source.slice(index + 1, close), bold: false, italic: false, code: true });
        index = close + 1;
        continue;
      }
    }
    if (source.startsWith("~~", index) && (strike || source.indexOf("~~", index + 2) !== -1)) {
      flush();
      strike = !strike;
      index += 2;
      continue;
    }
    if (source.startsWith("**", index) && (bold || source.indexOf("**", index + 2) !== -1)) {
      flush();
      bold = !bold;
      index += 2;
      continue;
    }
    if (source[index] === "*" && !source.startsWith("**", index) && (italic || hasItalicCloser(source, index + 1))) {
      flush();
      italic = !italic;
      index += 1;
      continue;
    }
    buffer += source[index];
    index += 1;
  }
  flush();
  return runs;
}

function isBullet(line: string) {
  return /^\s*[-*]\s+/.test(line) && !/^\s*\*\*/.test(line);
}

function isTableRow(line: string) {
  return /^\s*\|.+\|\s*$/.test(line);
}

function isTableDivider(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function tableCells(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => parseInlines(cell.trim()));
}

export function parseContract(markdown: string): ContractBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: ContractBlock[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      blocks.push({ type: "space" });
      index += 1;
      while (index < lines.length && !lines[index].trim()) index += 1;
      continue;
    }
    if (line.trim().startsWith("```")) {
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        body.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push({ type: "code", text: body.join("\n") });
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ type: "rule" });
      index += 1;
      continue;
    }
    const heading = /^(#{1,3})\s+(.*\S)\s*$/.exec(line);
    if (heading) {
      const level = heading[1].length as 1 | 2 | 3;
      blocks.push({ type: "heading", level, runs: parseInlines(heading[2]) });
      index += 1;
      continue;
    }
    const imageLine = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/.exec(line.trim());
    if (imageLine) {
      blocks.push({ type: "image", alt: imageLine[1], url: imageLine[2] });
      index += 1;
      continue;
    }
    if (/^\s*>\s?/.test(line)) {
      const quoted: string[] = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        quoted.push(lines[index].replace(/^\s*>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", runs: parseInlines(quoted.join(" ")) });
      continue;
    }
    if (isTableRow(line)) {
      const rows: TextRun[][][] = [];
      while (index < lines.length && isTableRow(lines[index])) {
        if (!isTableDivider(lines[index])) rows.push(tableCells(lines[index]));
        index += 1;
      }
      const headers = rows[0] ?? [];
      blocks.push({ type: "table", headers, rows: rows.slice(1) });
      continue;
    }
    if (isBullet(line)) {
      const items: TextRun[][] = [];
      while (index < lines.length && isBullet(lines[index])) {
        items.push(parseInlines(lines[index].replace(/^\s*[-*]\s+/, "")));
        index += 1;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: TextRun[][] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(parseInlines(lines[index].replace(/^\s*\d+\.\s+/, "")));
        index += 1;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }
    blocks.push({ type: "paragraph", runs: parseInlines(line) });
    index += 1;
  }
  return blocks;
}

export function renderContract(template: string, patient: Patient, professional: ContractProfessional | null) {
  const source = resolveContractTemplate(template);
  const filled = fillContractTemplate(source, contractFieldValues(patient, professional));
  return { filled, blocks: parseContract(filled) };
}

function contractFilename(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `contrato-${slug || "paciente"}.pdf`;
}

type PdfToken = TextRun;

function tokensFromRuns(runs: TextRun[]): PdfToken[] {
  const tokens: PdfToken[] = [];
  for (const run of runs) {
    if (run.image || run.code) {
      tokens.push(run);
      continue;
    }
    const parts = run.text.split(/(\s+)/).filter((part) => part.length > 0);
    for (const part of parts) tokens.push({ ...run, text: part });
  }
  return tokens;
}

async function imageDataUrl(url: string) {
  const { parseMarkdownImageRef } = await import("@/lib/cloudinary/markdown-asset");
  const { fetchSignedMediaUrl } = await import("@/lib/cloudinary/client-media");
  const { publicIdFromLegacyUrl } = await import("@/lib/cloudinary/asset");
  const asset = parseMarkdownImageRef(url) || publicIdFromLegacyUrl(url);
  const fetchUrl = asset ? await fetchSignedMediaUrl(asset) : url;
  const response = await fetch(fetchUrl);
  if (!response.ok) throw new Error("Não foi possível carregar a imagem do contrato.");
  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((item) => {
    binary += String.fromCharCode(item);
  });
  const mime = blob.type || "image/png";
  return { dataUrl: `data:${mime};base64,${btoa(binary)}`, mime };
}

function fontStyle(token: Pick<TextRun, "bold" | "italic">) {
  if (token.bold && token.italic) return "bolditalic";
  if (token.bold) return "bold";
  if (token.italic) return "italic";
  return "normal";
}

export async function createContractPdf(input: {
  template: string;
  patient: Patient;
  professional: ContractProfessional | null;
}) {
  const { jsPDF } = await import("jspdf");
  const { filled, blocks } = renderContract(input.template, input.patient, input.professional);
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const maxWidth = pageWidth - margin * 2;
  const bottom = pageHeight - 16;
  let y = 22;
  const ink: [number, number, number] = [36, 48, 40];
  const teal: [number, number, number] = [61, 82, 64];

  doc.setProperties({
    title: `Contrato de ${input.patient.nome.trim() || "paciente"}`,
    subject: "Contrato de prestação de serviços de psicoterapia",
  });

  function apply(token: Pick<TextRun, "bold" | "italic" | "code">, size: number, color: [number, number, number]) {
    doc.setFont(token.code ? "courier" : "times", token.code ? "normal" : fontStyle(token));
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  }

  function measure(token: Pick<TextRun, "bold" | "italic" | "text">, size: number) {
    apply(token, size, ink);
    return doc.getTextWidth(token.text);
  }

  function ensure(height: number) {
    if (y + height <= bottom) return;
    doc.addPage();
    y = 22;
  }

  function splitWide(token: PdfToken, size: number, width: number): PdfToken[] {
    if (measure(token, size) <= width) return [token];
    const pieces: PdfToken[] = [];
    let current = "";
    for (const char of token.text) {
      const next = current + char;
      if (current && measure({ ...token, text: next }, size) > width) {
        pieces.push({ ...token, text: current });
        current = char;
      } else {
        current = next;
      }
    }
    if (current) pieces.push({ ...token, text: current });
    return pieces;
  }

  function wrap(runs: TextRun[], size: number, width: number) {
    const lines: PdfToken[][] = [];
    let line: PdfToken[] = [];
    let used = 0;

    function commit() {
      while (line[0] && !line[0].text.trim()) line.shift();
      while (line.length > 0 && !line[line.length - 1].text.trim()) line.pop();
      if (line.length) lines.push(line);
      line = [];
      used = 0;
    }

    for (const token of tokensFromRuns(runs)) {
      if (token.image) continue;
      for (const piece of splitWide(token, size, width)) {
        const pieceWidth = measure(piece, size);
        const space = !piece.text.trim();
        if (space && line.length === 0) continue;
        if (used + pieceWidth > width && line.length > 0) commit();
        if (!piece.text.trim() && line.length === 0) continue;
        line.push(piece);
        used += pieceWidth;
      }
    }
    commit();
    return lines;
  }

  function drawLines(lines: PdfToken[][], size: number, indent: number, color: [number, number, number], gapAfter: number) {
    const leading = size * 0.48;
    if (lines.length === 0) {
      y += gapAfter;
      return;
    }
    for (const line of lines) {
      ensure(leading);
      let x = margin + indent;
      for (const token of line) {
        if (token.image) continue;
        apply(token, size, color);
        const width = doc.getTextWidth(token.text);
        doc.text(token.text, x, y);
        if (token.strike) {
          doc.setDrawColor(color[0], color[1], color[2]);
          doc.setLineWidth(0.2);
          doc.line(x, y - size * 0.12, x + width, y - size * 0.12);
        }
        x += width;
      }
      y += leading;
    }
    y += gapAfter;
  }

  function drawRuns(runs: TextRun[], size: number, indent: number, color: [number, number, number], gapAfter: number) {
    drawLines(wrap(runs.filter((run) => !run.image), size, maxWidth - indent), size, indent, color, gapAfter);
  }

  async function drawPicture(url: string, alt: string) {
    try {
      const { dataUrl, mime } = await imageDataUrl(url);
      const format = mime.includes("png") ? "PNG" : mime.includes("webp") ? "WEBP" : "JPEG";
      const props = doc.getImageProperties(dataUrl);
      const width = Math.min(maxWidth, 90);
      const height = props.width ? (props.height / props.width) * width : 40;
      ensure(height + 4);
      doc.addImage(dataUrl, format, margin, y, width, height);
      y += height + 4;
    } catch {
      drawRuns([{ text: alt || "Imagem", bold: false, italic: true }], 10, 0, [90, 103, 92], 2);
    }
  }

  for (const block of blocks) {
    if (block.type === "space") {
      y += 3;
      continue;
    }
    if (block.type === "rule") {
      ensure(6);
      doc.setDrawColor(teal[0], teal[1], teal[2]);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
      continue;
    }
    if (block.type === "heading") {
      const size = block.level === 1 ? 18 : block.level === 2 ? 14 : 12;
      drawRuns(block.runs, size, 0, teal, block.level === 1 ? 4 : 2.5);
      continue;
    }
    if (block.type === "image") {
      await drawPicture(block.url, block.alt);
      continue;
    }
    if (block.type === "quote") {
      ensure(8);
      doc.setDrawColor(teal[0], teal[1], teal[2]);
      doc.setLineWidth(0.8);
      const start = y;
      drawRuns(block.runs, 11, 5, [90, 103, 92], 2);
      doc.line(margin, start - 3, margin, y - 2);
      continue;
    }
    if (block.type === "code") {
      const lines = (block.text || " ").split("\n");
      const height = Math.max(10, lines.length * 5 + 6);
      ensure(height);
      doc.setFillColor(244, 247, 242);
      doc.rect(margin, y - 3, maxWidth, height, "F");
      doc.setFont("courier", "normal");
      doc.setFontSize(9);
      doc.setTextColor(ink[0], ink[1], ink[2]);
      lines.forEach((line, lineIndex) => {
        doc.text(line || " ", margin + 2, y + 2 + lineIndex * 5);
      });
      y += height + 2;
      continue;
    }
    if (block.type === "table") {
      const cols = Math.max(1, block.headers.length);
      const width = maxWidth / cols;
      const all = [block.headers, ...block.rows];
      for (const [rowIndex, row] of all.entries()) {
        ensure(8);
        if (rowIndex === 0) {
          doc.setFillColor(231, 240, 229);
          doc.rect(margin, y - 4, maxWidth, 8, "F");
        }
        row.slice(0, cols).forEach((cell, col) => {
          const label = cell.map((run) => run.text).join(" ");
          apply({ bold: rowIndex === 0, italic: false }, 9, rowIndex === 0 ? teal : ink);
          doc.text(label.slice(0, 42), margin + col * width + 1.5, y);
        });
        y += 7;
      }
      y += 2;
      continue;
    }
    if (block.type === "list") {
      block.items.forEach((item, itemIndex) => {
        const prefix = block.ordered ? `${itemIndex + 1}.` : "•";
        const textIndent = 8;
        const lines = wrap(item, 11, maxWidth - textIndent);
        const leading = 11 * 0.48;
        const drawn = lines.length ? lines : [[]];
        drawn.forEach((line, lineIndex) => {
          ensure(leading);
          if (lineIndex === 0) {
            apply({ bold: false, italic: false }, 11, ink);
            doc.text(prefix, margin, y);
          }
          let x = margin + textIndent;
          for (const token of line) {
            apply(token, 11, ink);
            doc.text(token.text, x, y);
            x += doc.getTextWidth(token.text);
          }
          y += leading;
        });
      });
      y += 1.5;
      continue;
    }
    drawRuns(block.runs, 11, 0, ink, 1.2);
  }

  if (!filled.trim()) {
    drawRuns([{ text: EMPTY_VALUE, bold: false, italic: false }], 11, 0, ink, 0);
  }

  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    apply({ bold: false, italic: false }, 9, [90, 103, 92]);
    doc.text(`${page} / ${total}`, pageWidth / 2, pageHeight - 8, { align: "center" });
  }

  const buffer = doc.output("arraybuffer");
  return {
    filename: contractFilename(input.patient.nome),
    bytes: new Uint8Array(buffer),
  };
}

export async function downloadContractPdf(input: {
  template: string;
  patient: Patient;
  professional: ContractProfessional | null;
}) {
  if (typeof document === "undefined") throw new Error("O PDF do contrato é gerado no navegador.");
  const { filename, bytes } = await createContractPdf(input);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
