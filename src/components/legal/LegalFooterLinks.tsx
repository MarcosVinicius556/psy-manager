"use client";

import Link from "next/link";
import { LEGAL_FOOTER_LINKS } from "@/lib/legal/config";
import { useCookieConsent } from "@/components/legal/CookieConsentProvider";

type Props = {
  className?: string;
  linkClassName?: string;
  showCookiePreferences?: boolean;
};

export default function LegalFooterLinks({ className, linkClassName, showCookiePreferences = true }: Props) {
  const { openPreferences } = useCookieConsent();

  return (
    <div className={className}>
      {LEGAL_FOOTER_LINKS.map((link) => (
        <Link key={link.href} href={link.href} className={linkClassName}>
          {link.label}
        </Link>
      ))}
      {showCookiePreferences ? (
        <button type="button" className={linkClassName} onClick={() => openPreferences()}>
          Preferências de cookies
        </button>
      ) : null}
    </div>
  );
}
