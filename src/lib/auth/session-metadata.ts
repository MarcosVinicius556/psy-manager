import type { User } from "firebase/auth";

export function formatAuthTimestamp(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function sessionMetadataLines(user: User | null): { lastSignIn: string | null; created: string | null } {
  if (!user) return { lastSignIn: null, created: null };
  return {
    lastSignIn: formatAuthTimestamp(user.metadata.lastSignInTime),
    created: formatAuthTimestamp(user.metadata.creationTime),
  };
}
