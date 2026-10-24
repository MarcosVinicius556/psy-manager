import { GeoPoint, Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";
import {
  deserializeFirestoreValue,
  serializeFirestoreValue,
} from "../../../scripts/backup/serde";

describe("backup serde", () => {
  it("serializa e deserializa tipos especiais do Firestore", () => {
    const db = {
      doc: (p: string) => ({ path: p, firestore: db }),
    };
    const input = {
      when: Timestamp.fromDate(new Date("2024-06-01T00:00:00.000Z")),
      where: new GeoPoint(-23.5, -46.6),
      link: db.doc("accounts/abc"),
      blob: Buffer.from("hello"),
      nested: [{ x: 1 }],
    };

    const serialized = serializeFirestoreValue(input);
    const restored = deserializeFirestoreValue(serialized, db as never);

    expect((restored as { when: Timestamp }).when.toDate().toISOString()).toBe(
      input.when.toDate().toISOString(),
    );
    expect((restored as { where: GeoPoint }).where.latitude).toBe(-23.5);
    expect((restored as { link: { path: string } }).link.path).toBe("accounts/abc");
    expect((restored as { blob: Buffer }).blob.toString()).toBe("hello");
  });
});
