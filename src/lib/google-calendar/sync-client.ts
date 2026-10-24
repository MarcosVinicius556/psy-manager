import { getFirebaseAuth } from "@/lib/admin/firebase";
import { toast } from "react-toastify";

const WARN =
  "O atendimento foi salvo, mas a sincronização com o Google Agenda falhou. Você pode tentar de novo editando o horário.";

async function idToken() {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) return "";
  return user.getIdToken();
}

export async function syncAppointmentWithGoogle(appointmentId: string, action: "upsert" | "delete" = "upsert") {
  if (!appointmentId) return;
  const token = await idToken();
  if (!token) return;
  try {
    const response = await fetch("/api/integrations/google-calendar/sync", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, action }),
    });
    if (!response.ok) toast.warn(WARN);
  } catch {
    toast.warn(WARN);
  }
}
