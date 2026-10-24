/**
 * Migra anexos clínicos do Cloudinary de entrega pública (`upload`) para `authenticated`
 * e atualiza referências no Firestore (publicId em vez de URL).
 *
 * Padrão: dry-run (nenhuma escrita). Passe --apply para executar de verdade.
 *
 * Uso (NÃO rode em produção sem revisão e backup):
 *   export GOOGLE_APPLICATION_CREDENTIALS=/caminho/sa.json
 *   export NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
 *   export CLOUDINARY_API_KEY=...
 *   export CLOUDINARY_API_SECRET=...
 *   npx tsx scripts/migrate-cloudinary-to-authenticated.ts
 *   npx tsx scripts/migrate-cloudinary-to-authenticated.ts --apply
 */
import { v2 as cloudinary } from "cloudinary";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { publicIdFromLegacyUrl } from "../src/lib/cloudinary/asset";

const apply = process.argv.includes("--apply");

function env(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variável ausente: ${name}`);
  return value;
}

function initFirebase() {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) throw new Error("Defina FIREBASE_PROJECT_ID ou NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    initializeApp({ projectId });
  }
  return getFirestore();
}

function initCloudinary() {
  cloudinary.config({
    cloud_name: env("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"),
    api_key: env("CLOUDINARY_API_KEY"),
    api_secret: env("CLOUDINARY_API_SECRET"),
  });
}

function isLegacyPublicUrl(value: unknown) {
  return typeof value === "string" && value.includes("res.cloudinary.com") && value.includes("/upload/");
}

function attachmentFromUrl(url: string) {
  const asset = publicIdFromLegacyUrl(url);
  if (!asset) return null;
  if (asset.publicId.startsWith("avatars/")) return null;
  return {
    publicId: asset.publicId,
    resourceType: asset.resourceType,
    format: asset.format,
  };
}

function migrateAttachment(value: unknown) {
  if (!value || typeof value !== "object") return { changed: false, next: value };
  const row = value as { url?: string; asset?: unknown; nome?: string; mime?: string; id?: string };
  if (row.asset && typeof row.asset === "object") return { changed: false, next: value };
  const url = row.url?.trim();
  if (!url || !isLegacyPublicUrl(url)) return { changed: false, next: value };
  const asset = attachmentFromUrl(url);
  if (!asset) return { changed: false, next: value };
  const next = { ...row, asset, url: undefined };
  delete next.url;
  return { changed: true, next };
}

function migrateAttachmentsArray(value: unknown) {
  if (!Array.isArray(value)) return { changed: false, next: value };
  let changed = false;
  const next = value.map((item) => {
    const result = migrateAttachment(item);
    if (result.changed) changed = true;
    return result.next;
  });
  return { changed, next };
}

async function setAuthenticated(publicId: string, resourceType: string) {
  if (!apply) {
    console.log(`[dry-run] cloudinary update access authenticated: ${resourceType}/${publicId}`);
    return;
  }
  const resource_type = resourceType === "video" ? "video" : resourceType === "raw" ? "raw" : "image";
  await cloudinary.uploader.explicit(publicId, { type: "authenticated", resource_type });
}

async function main() {
  initCloudinary();
  const db = initFirebase();
  let docsTouched = 0;
  let assetsUpdated = 0;

  const patients = await db.collection("patients").get();
  for (const doc of patients.docs) {
    const data = doc.data();
    const patch: Record<string, unknown> = {};
    if (isLegacyPublicUrl(data.foto)) {
      const asset = attachmentFromUrl(data.foto);
      if (asset) {
        patch.foto = "";
        patch.fotoAsset = asset;
        await setAuthenticated(asset.publicId, asset.resourceType);
        assetsUpdated += 1;
      }
    }
    const contract = migrateAttachment(data.contratoAssinado);
    if (contract.changed) {
      patch.contratoAssinado = contract.next;
      const asset = (contract.next as { asset?: { publicId: string; resourceType: string } }).asset;
      if (asset) {
        await setAuthenticated(asset.publicId, asset.resourceType);
        assetsUpdated += 1;
      }
    }
    if (Object.keys(patch).length) {
      docsTouched += 1;
      console.log(`${apply ? "apply" : "dry-run"} patients/${doc.id}`, patch);
      if (apply) await doc.ref.update(patch);
    }
  }

  const appointments = await db.collection("appointments").get();
  for (const doc of appointments.docs) {
    const clinical = (doc.data().clinical ?? {}) as Record<string, unknown>;
    const patchClinical: Record<string, unknown> = { ...clinical };
    let changed = false;
    for (const key of ["anamneseArquivos", "atividadesArquivos"] as const) {
      const result = migrateAttachmentsArray(clinical[key]);
      if (result.changed) {
        changed = true;
        patchClinical[key] = result.next;
        for (const item of result.next as { asset?: { publicId: string; resourceType: string } }[]) {
          if (item.asset) {
            await setAuthenticated(item.asset.publicId, item.asset.resourceType);
            assetsUpdated += 1;
          }
        }
      }
    }
    if (changed) {
      docsTouched += 1;
      console.log(`${apply ? "apply" : "dry-run"} appointments/${doc.id} clinical`);
      if (apply) await doc.ref.update({ clinical: patchClinical });
    }
  }

  const payments = await db.collection("payments").get();
  for (const doc of payments.docs) {
    const historico = doc.data().historico;
    if (!Array.isArray(historico)) continue;
    let changed = false;
    const nextHistorico = historico.map((event) => {
      if (!event || typeof event !== "object") return event;
      const comprovante = migrateAttachment((event as { comprovante?: unknown }).comprovante);
      if (!comprovante.changed) return event;
      changed = true;
      const asset = (comprovante.next as { asset?: { publicId: string; resourceType: string } }).asset;
      if (asset) void setAuthenticated(asset.publicId, asset.resourceType);
      return { ...event, comprovante: comprovante.next };
    });
    if (changed) {
      docsTouched += 1;
      console.log(`${apply ? "apply" : "dry-run"} payments/${doc.id} historico`);
      if (apply) await doc.ref.update({ historico: nextHistorico });
    }
  }

  const reportRuns = await db.collection("reportRuns").get();
  for (const doc of reportRuns.docs) {
    const pdf = migrateAttachment(doc.data().pdf);
    if (!pdf.changed) continue;
    docsTouched += 1;
    const asset = (pdf.next as { asset?: { publicId: string; resourceType: string } }).asset;
    if (asset) await setAuthenticated(asset.publicId, asset.resourceType);
    console.log(`${apply ? "apply" : "dry-run"} reportRuns/${doc.id} pdf`);
    if (apply) await doc.ref.update({ pdf: pdf.next });
  }

  console.log(`Concluído (${apply ? "apply" : "dry-run"}): ${docsTouched} documento(s), ${assetsUpdated} recurso(s) Cloudinary.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
