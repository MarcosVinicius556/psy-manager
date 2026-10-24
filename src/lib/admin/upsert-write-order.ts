export type UpsertPsychologistPhase = "ensureUser" | "ensureMember" | "publishDirectory";

export function upsertPsychologistPhases(userDocExists: boolean): UpsertPsychologistPhase[] {
  const phases: UpsertPsychologistPhase[] = [];
  if (!userDocExists) phases.push("ensureUser");
  phases.push("ensureMember", "publishDirectory");
  return phases;
}
