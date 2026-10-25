import { NextResponse } from "next/server";

export function jsonError(status: number, reason: string, detail?: string) {
  return NextResponse.json({ reason, detail }, { status });
}

export function mapStoreError(error: unknown) {
  const code = error instanceof Error ? (error as Error & { code?: string }).code : undefined;
  const message = error instanceof Error ? error.message : "erro";
  if (code === "transicao_invalida" || message.includes("Transição")) {
    return jsonError(409, "transicao_invalida", message);
  }
  if (code === "conflito_versao") return jsonError(409, "conflito_versao");
  if (code === "locked") return jsonError(409, "ticket_bloqueado");
  if (code === "lock_invalido") return jsonError(409, "lock_invalido");
  if (code === "status_invalido") return jsonError(409, "status_invalido");
  if (message === "ticket_nao_encontrado") return jsonError(404, "nao_encontrado");
  return jsonError(500, "erro_interno", message);
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
