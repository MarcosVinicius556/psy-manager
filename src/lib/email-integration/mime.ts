import type { OutboundAttachment } from "./types";

function encodeSubjectUtf8(subject: string) {
  if (/^[\x00-\x7F]*$/.test(subject)) return subject;
  const encoded = Buffer.from(subject, "utf8").toString("base64");
  return `=?UTF-8?B?${encoded}?=`;
}

function wrapBase64Lines(base64: string) {
  const lines: string[] = [];
  for (let i = 0; i < base64.length; i += 76) {
    lines.push(base64.slice(i, i + 76));
  }
  return lines.join("\r\n");
}

export function buildMimeMessage(input: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: OutboundAttachment[];
}) {
  const boundary = `mixed_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  const altBoundary = `alt_${boundary}`;
  const subject = encodeSubjectUtf8(input.subject);
  const lines: string[] = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    "",
    `--${altBoundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    input.text,
    "",
    `--${altBoundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    input.html,
    "",
    `--${altBoundary}--`,
  ];

  for (const file of input.attachments || []) {
    lines.push(
      `--${boundary}`,
      `Content-Type: ${file.contentType}; name="${file.filename}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${file.filename}"`,
      "",
      wrapBase64Lines(file.contentBase64),
      ""
    );
  }
  lines.push(`--${boundary}--`);
  const raw = lines.join("\r\n");
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
