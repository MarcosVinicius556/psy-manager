import { NextResponse } from "next/server";
import { SCALE_FORM_TEMPLATES, SATEPSI_CFP_NOTE } from "@/lib/scales/catalog";
import { listScaleSeries } from "@/lib/server/patient-portal/data";
import { requirePatientAuth } from "@/lib/server/patient-portal/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requirePatientAuth(request);
  if ("error" in session) return session.error;

  const series: Record<string, { submittedAt: string; pontuacao: number; faixa: string }[]> = {};
  for (const template of SCALE_FORM_TEMPLATES) {
    series[template.id] = await listScaleSeries(session.db, session.link, template.id);
  }

  return NextResponse.json({
    scales: SCALE_FORM_TEMPLATES.map((item) => ({
      id: item.id,
      nome: item.nome,
      descricao: item.descricao,
      finalidade: item.finalidade,
      campos: item.campos,
      series: series[item.id] || [],
    })),
    satepsiNote: SATEPSI_CFP_NOTE,
  });
}
