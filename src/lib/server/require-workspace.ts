import { NextResponse } from "next/server";
import { resolveWorkspace, staffHasPerm } from "./team-access";
import type { StaffPermission, WorkspaceContext } from "@/lib/team/types";
import { requireAuthUser } from "./require-auth";

export async function requireWorkspace(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return { error: auth.error };
  const workspace = await resolveWorkspace(auth.idToken);
  if (!workspace) {
    return { error: NextResponse.json({ reason: "nao_autorizado" }, { status: 401 }) };
  }
  return { auth, workspace };
}

export function forbidUnlessStaffPerm(workspace: WorkspaceContext, perm: StaffPermission) {
  if (!staffHasPerm(workspace, perm)) {
    return NextResponse.json({ reason: "proibido" }, { status: 403 });
  }
  return null;
}
