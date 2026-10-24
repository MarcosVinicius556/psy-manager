import {
  type CollectionReference,
  type DocumentReference,
  FieldPath,
  GeoPoint,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";

export type TaggedValue =
  | { __type: "timestamp"; seconds: number; nanoseconds: number }
  | { __type: "geopoint"; latitude: number; longitude: number }
  | { __type: "reference"; path: string }
  | { __type: "bytes"; base64: string };

export type ExportedDocument = {
  path: string;
  data: Record<string, unknown>;
};

/** Converte valores do Firestore para JSON com tags reversíveis na restauração. */
export function serializeFirestoreValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (value instanceof Timestamp) {
    return {
      __type: "timestamp",
      seconds: value.seconds,
      nanoseconds: value.nanoseconds,
    } satisfies TaggedValue;
  }
  if (value instanceof GeoPoint) {
    return {
      __type: "geopoint",
      latitude: value.latitude,
      longitude: value.longitude,
    } satisfies TaggedValue;
  }
  if (value instanceof FieldPath) {
    throw new Error("FieldPath em dados de documento não é suportado no backup");
  }
  if (isDocumentReference(value)) {
    return {
      __type: "reference",
      path: value.path,
    } satisfies TaggedValue;
  }
  if (value instanceof Buffer) {
    return {
      __type: "bytes",
      base64: value.toString("base64"),
    } satisfies TaggedValue;
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeFirestoreValue(item));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = serializeFirestoreValue(nested);
    }
    return out;
  }
  return value;
}

function isDocumentReference(value: unknown): value is DocumentReference {
  return (
    typeof value === "object" &&
    value !== null &&
    "path" in value &&
    typeof (value as DocumentReference).path === "string" &&
    typeof (value as { firestore?: unknown }).firestore !== "undefined"
  );
}

/** Restaura valores tagged para tipos do Admin SDK no projeto de destino. */
export function deserializeFirestoreValue(value: unknown, db: Firestore): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => deserializeFirestoreValue(item, db));
  }
  if (typeof value === "object") {
    const tagged = value as Record<string, unknown>;
    if (tagged.__type === "timestamp") {
      return new Timestamp(
        tagged.seconds as number,
        tagged.nanoseconds as number,
      );
    }
    if (tagged.__type === "geopoint") {
      return new GeoPoint(tagged.latitude as number, tagged.longitude as number);
    }
    if (tagged.__type === "reference") {
      return db.doc(tagged.path as string);
    }
    if (tagged.__type === "bytes") {
      return Buffer.from(tagged.base64 as string, "base64");
    }
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(tagged)) {
      out[key] = deserializeFirestoreValue(nested, db);
    }
    return out;
  }
  return value;
}

export function collectionRefFromPath(db: Firestore, collectionPath: string) {
  const segments = collectionPath.split("/").filter(Boolean);
  if (segments.length === 0 || segments.length % 2 === 0) {
    throw new Error(`Caminho de coleção inválido: ${collectionPath}`);
  }
  let ref: CollectionReference | Firestore | DocumentReference = db;
  for (let i = 0; i < segments.length; i++) {
    if (i % 2 === 0) {
      ref = (ref as Firestore).collection(segments[i]);
    } else {
      ref = (ref as CollectionReference).doc(segments[i]);
    }
  }
  return ref as CollectionReference;
}

export function collectionPathKey(collectionPath: string): string {
  return collectionPath.split("/").join("__");
}
