import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Rotas públicas que nunca devem redirecionar para login (feedback do paciente, legal/LGPD).
 */
export function middleware(request: NextRequest) {
  void request.nextUrl.pathname;
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/feedback/:path*",
    "/agendar/:path*",
    "/confirmar/:path*",
    "/assinar/:path*",
    "/formulario/:path*",
    "/api/public/:path*",
    "/api/legal/:path*",
    "/privacidade",
    "/termos",
    "/cookies",
    "/seguranca",
    "/suboperadores",
    "/dpa",
  ],
};
