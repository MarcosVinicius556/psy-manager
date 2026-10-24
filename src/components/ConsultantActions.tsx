import {
  CONSULTANT_WHATSAPP_LABEL,
  consultantMailto,
  consultantWhatsAppUrl,
} from "@/lib/contact";

export default function ConsultantActions({
  email = "",
  whatsappLabel = "WhatsApp",
  emailLabel = "Enviar e-mail",
}: {
  email?: string;
  whatsappLabel?: string;
  emailLabel?: string;
}) {
  const mail = email || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";
  return (
    <div className="flex flex-wrap gap-3">
      <a href={consultantWhatsAppUrl()} className="btn-primary" target="_blank" rel="noreferrer">
        {whatsappLabel}
      </a>
      {mail ? (
        <a href={consultantMailto(mail)} className="btn-text">
          {emailLabel}
        </a>
      ) : null}
      <p className="basis-full text-sm text-muted">
        WhatsApp {CONSULTANT_WHATSAPP_LABEL}
        {mail ? ` · ${mail}` : ""}
      </p>
    </div>
  );
}
