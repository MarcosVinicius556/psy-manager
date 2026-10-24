import { redirect } from "next/navigation";

export default function NewPatientPage() {
  redirect("/admin/pacientes?novo=1");
}
