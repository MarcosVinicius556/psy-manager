"use client";

import { AuthProvider } from "@/lib/admin/auth-context";
import { CookieConsentProvider } from "@/components/legal/CookieConsentProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CookieConsentProvider>{children}</CookieConsentProvider>
    </AuthProvider>
  );
}
