import Link from "next/link";
import { Card, PageTitle } from "./ui";

export default function SetupNeeded({
  title,
  missingPatient,
  missingLocation,
}: {
  title: string;
  missingPatient: boolean;
  missingLocation: boolean;
}) {
  return (
    <div>
      <PageTitle title={title} subtitle="Falta um cadastro para liberar esta área." />
      <Card>
        <h2 className="text-2xl font-medium text-teal">Cadastre o básico antes de continuar</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Esta área usa pacientes e um local de atendimento. Cadastre o que ainda falta e volte em seguida.
        </p>
        <ul className="mt-5 grid gap-3">
          {missingPatient && (
            <li className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-paper px-4 py-3">
              <span>Nenhum paciente cadastrado.</span>
              <Link href="/admin/pacientes?novo=1" className="btn-row">
                Cadastrar paciente
              </Link>
            </li>
          )}
          {missingLocation && (
            <li className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-paper px-4 py-3">
              <span>Nenhum local de atendimento cadastrado.</span>
              <Link href="/admin/locais" className="btn-row">
                Cadastrar local
              </Link>
            </li>
          )}
        </ul>
      </Card>
    </div>
  );
}
