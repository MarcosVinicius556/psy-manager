import { describe, expect, it } from "vitest";
import { prefersGoogleRedirect, trialEligibleFromUserDoc } from "./google-auth-flow";

describe("prefersGoogleRedirect", () => {
  it("detecta webviews embutidos", () => {
    expect(prefersGoogleRedirect()).toBe(false);
    const original = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Linux; Android 10) Instagram 123.0.0.0",
    });
    expect(prefersGoogleRedirect()).toBe(true);
    Object.defineProperty(navigator, "userAgent", { configurable: true, value: original });
  });
});

describe("trialEligibleFromUserDoc", () => {
  it("marca replay negado como inelegível", () => {
    expect(
      trialEligibleFromUserDoc({
        billingAccess: "restrito",
        subscriptionStatus: "trial_expirado",
      })
    ).toBe(false);
  });

  it("mantém trial ativo como elegível", () => {
    expect(
      trialEligibleFromUserDoc({
        billingAccess: "trial",
        subscriptionStatus: "trial_ativo",
      })
    ).toBe(true);
  });
});
