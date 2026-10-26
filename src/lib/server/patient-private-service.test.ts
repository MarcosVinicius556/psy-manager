import { describe, expect, it } from "vitest";
import {
  legacyPrivateFromPatient,
  mergePrivateFields,
  readPatientPrivateForOwner,
  writePatientPrivateForOwner,
} from "./patient-private-service";

describe("patient-private-service", () => {
  it("lê observações legadas do documento patients quando não há patientPrivate", async () => {
    const db = {
      collection: (name: string) => ({
        doc: (id: string) => ({
          get: async () => {
            if (name === "patients" && id === "p1") {
              return {
                exists: true,
                data: () => ({
                  ownerUid: "owner-1",
                  observacoes: "Nota legada",
                  contatoEmergencia: "Maria (mãe)",
                }),
              };
            }
            if (name === "patientPrivate") {
              return { exists: false, data: () => undefined };
            }
            return { exists: false, data: () => undefined };
          },
          set: async () => undefined,
          update: async () => undefined,
        }),
      }),
    };

    const fields = await readPatientPrivateForOwner(db as never, "owner-1", "p1");
    expect(fields).toEqual({
      observacoes: "Nota legada",
      contatoEmergencia: "Maria (mãe)",
    });
  });

  it("migra lazy: grava patientPrivate e remove campos legados do patients", async () => {
    const updates: Record<string, unknown>[] = [];
    const sets: Record<string, unknown>[] = [];
    const db = {
      collection: (name: string) => ({
        doc: (id: string) => ({
          get: async () => {
            if (name === "patients" && id === "p1") {
              return {
                exists: true,
                data: () => ({
                  ownerUid: "owner-1",
                  observacoes: "Antiga",
                  contatoEmergencia: "Contato antigo",
                }),
              };
            }
            return { exists: false, data: () => undefined };
          },
          set: async (_data: unknown) => {
            sets.push(_data as Record<string, unknown>);
          },
          update: async (data: unknown) => {
            updates.push(data as Record<string, unknown>);
          },
        }),
      }),
    };

    const result = await writePatientPrivateForOwner(db as never, "owner-1", "p1", {
      observacoes: "Nova nota",
      contatoEmergencia: "Novo contato",
    });
    expect(result).toEqual({ ok: true });
    expect(sets[0]).toMatchObject({
      observacoes: "Nova nota",
      contatoEmergencia: "Novo contato",
      ownerUid: "owner-1",
      patientId: "p1",
    });
    expect(updates.length).toBe(1);
  });

  it("mergePrivateFields prefere patientPrivate quando preenchido", () => {
    const merged = mergePrivateFields(
      { observacoes: "No cofre", contatoEmergencia: "Cofre" },
      { observacoes: "Legado", contatoEmergencia: "Legado contato" }
    );
    expect(merged.observacoes).toBe("No cofre");
  });

  it("legacyPrivateFromPatient extrai strings", () => {
    expect(legacyPrivateFromPatient({ observacoes: "a", contatoEmergencia: "b" })).toEqual({
      observacoes: "a",
      contatoEmergencia: "b",
    });
  });
});
