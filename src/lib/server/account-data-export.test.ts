import { describe, expect, it } from "vitest";
import { buildAccountExportZipBytes } from "./account-data-export";

function mockDb(collections: Record<string, { id: string; data: Record<string, unknown> }[]>) {
  return {
    collection(name: string) {
      const rows = collections[name] ?? [];
      return {
        where(field: string, _op: string, value: unknown) {
          return {
            limit(_n: number) {
              return {
                async get() {
                  const docs = rows.filter((row) => row.data[field] === value);
                  return {
                    docs: docs.map((row) => ({
                      id: row.id,
                      data: () => row.data,
                    })),
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

describe("buildAccountExportZipBytes", () => {
  it("inclui prontuários do tenant no manifest", async () => {
    const ownerUid = "owner-a";
    const db = mockDb({
      patients: [{ id: "p1", data: { ownerUid, nome: "Paciente" } }],
      appointments: [{ id: "a1", data: { ownerUid, sessionStartMillis: 100 } }],
      payments: [{ id: "pay1", data: { ownerUid, valor: 10 } }],
      clinicalRecords: [{ id: "cr1", data: { ownerUid, appointmentId: "a1", clinical: { notes: "x" } } }],
    });

    const zip = await buildAccountExportZipBytes(db as never, ownerUid);
    expect(zip.byteLength).toBeGreaterThan(50);
    const { unzipSync, strFromU8 } = await import("fflate");
    const files = unzipSync(zip);
    const manifest = JSON.parse(strFromU8(files["manifest.json"])) as {
      counts: { clinicalRecords: number };
    };
    expect(manifest.counts.clinicalRecords).toBe(1);
    const clinical = JSON.parse(strFromU8(files["prontuarios.json"])) as { id: string }[];
    expect(clinical[0]?.id).toBe("cr1");
  });
});
