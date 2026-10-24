"use client";

import { AuthProvider } from "@/lib/admin/auth-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
