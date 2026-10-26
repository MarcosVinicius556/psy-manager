import { NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/server/require-workspace";

export async function GET(request: Request) {
  const ctx = await requireWorkspace(request);
  if ("error" in ctx) return ctx.error;
  const { workspace, auth } = ctx;
  return NextResponse.json({
    workspace,
    email: auth.email,
  });
}
