import type { Metadata } from "next";
import PatientPortalShell from "@/components/patient/PatientPortalShell";
import { PatientAuthProvider } from "@/lib/patient/auth-context";

export const metadata: Metadata = {
  title: "Portal do paciente · Psy Manager",
  description: "Sessões, pagamentos, diário e documentos entre as consultas.",
  manifest: "/paciente/manifest.webmanifest",
};

export default function PatientPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PatientAuthProvider>
      <PatientPortalShell>{children}</PatientPortalShell>
    </PatientAuthProvider>
  );
}
