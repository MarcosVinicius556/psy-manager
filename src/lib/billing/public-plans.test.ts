import { describe, expect, it } from "vitest";
import { PUBLIC_BILLING } from "./plans";
import { mergePublicPlans } from "./public-plans";
import { DEFAULT_PLANS } from "@/lib/saas/model";

describe("mergePublicPlans", () => {
  it("aplica preços do config local", () => {
    const cards = mergePublicPlans(DEFAULT_PLANS);
    const monthly = cards.find((item) => item.id === "consultorio");
    const annual = cards.find((item) => item.id === "consultorio_anual");
    expect(monthly?.precoCentavos).toBe(PUBLIC_BILLING.monthlyCents);
    expect(annual?.precoCentavos).toBe(PUBLIC_BILLING.annualCents);
    expect(annual?.destaque).toBe(true);
  });
});
