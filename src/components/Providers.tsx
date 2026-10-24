"use client";

import { AuthProvider } from "@/lib/admin/auth-context";
import SessionIdleProvider from "@/components/auth/SessionIdleProvider";
import { CookieConsentProvider } from "@/components/legal/CookieConsentProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SessionIdleProvider>
        <CookieConsentProvider>{children}</CookieConsentProvider>
      </SessionIdleProvider>
    </AuthProvider>
  );
}
