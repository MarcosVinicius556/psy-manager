import { getAdminDb } from "@/lib/firebase-admin";
import { mapPlan } from "@/lib/saas/account-store";
import { DEFAULT_PLANS, type PlanDefinition } from "@/lib/saas/model";
import { mergePublicPlans, type PublicPlanCard } from "@/lib/billing/public-plans";

export const PUBLIC_PLANS_REVALIDATE_SECONDS = 3600;

async function loadRemotePlansAdmin(): Promise<PlanDefinition[]> {
  const db = getAdminDb();
  if (!db) return [];
  const snapshot = await db.collection("plans").get();
  return snapshot.docs
    .map((doc) => mapPlan(doc.id, doc.data()))
    .filter((item): item is PlanDefinition => Boolean(item))
    .sort((a, b) => a.ordem - b.ordem);
}

export async function fetchPublicPlanCards(): Promise<PublicPlanCard[]> {
  const remote = await loadRemotePlansAdmin();
  return mergePublicPlans(remote.length ? remote : DEFAULT_PLANS);
}
