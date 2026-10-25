import nodemailer from "nodemailer";
import type { OutboundAttachment } from "./types";
import { decryptCredential, readEmailIntegration } from "./store";

export async function sendViaUserSmtp(
  uid: string,
  input: {
    to: string;
    subject: string;
    html: string;
    text: string;
    attachments?: OutboundAttachment[];
  }
) {
  const record = await readEmailIntegration(uid);
  if (!record?.smtpPasswordEncrypted || record.provider !== "gmail_smtp" || !record.connectedAddress) {
    throw new Error("smtp_nao_configurado");
  }
  const pass = decryptCredential(record.smtpPasswordEncrypted);
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: record.connectedAddress, pass },
  });
  await transporter.sendMail({
    from: `"${record.connectedAddress}" <${record.connectedAddress}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    attachments: (input.attachments || []).map((file) => ({
      filename: file.filename,
      content: Buffer.from(file.contentBase64, "base64"),
      contentType: file.contentType,
    })),
  });
}
