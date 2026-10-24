export const CONSULTANT_WHATSAPP = "5549998266688";
export const CONSULTANT_WHATSAPP_LABEL = "(49) 9 9826-6688";
export const CONSULTANT_MESSAGE =
  "Olá! Gostaria de falar com um consultor sobre o plano pago da Psy Manager.";

export function consultantWhatsAppUrl(message = CONSULTANT_MESSAGE) {
  return `https://wa.me/${CONSULTANT_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export function consultantEmail() {
  return (process.env.NEXT_PUBLIC_CONTACT_EMAIL || process.env.EMAIL_TO || "").trim();
}

export function consultantMailto(
  email: string,
  subject = "Psy Manager — plano pago",
  body = CONSULTANT_MESSAGE,
) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
