import { describe, expect, it } from "vitest";
import {
  FEATURE_FLAG_DEFAULTS,
  featureFlagEnvKey,
  parseFeatureFlagValue,
  resolveFeatureFlag,
} from "./feature-flags";

describe("featureFlagEnvKey", () => {
  it("monta o nome da variável NEXT_PUBLIC_FEATURE_*", () => {
    expect(featureFlagEnvKey("dashboardCustomization")).toBe("NEXT_PUBLIC_FEATURE_DASHBOARD_CUSTOMIZATION");
  });
});

describe("parseFeatureFlagValue", () => {
  it("habilita só com true ou 1", () => {
    expect(parseFeatureFlagValue("true")).toBe(true);
    expect(parseFeatureFlagValue("TRUE")).toBe(true);
    expect(parseFeatureFlagValue("1")).toBe(true);
    expect(parseFeatureFlagValue(" false ")).toBe(false);
    expect(parseFeatureFlagValue("0")).toBe(false);
    expect(parseFeatureFlagValue("yes")).toBe(false);
    expect(parseFeatureFlagValue("")).toBe(false);
    expect(parseFeatureFlagValue(undefined)).toBe(false);
    expect(parseFeatureFlagValue(null)).toBe(false);
  });
});

describe("resolveFeatureFlag", () => {
  it("usa o default do registro quando a variável não está definida", () => {
    expect(resolveFeatureFlag("dashboardCustomization", undefined)).toBe(FEATURE_FLAG_DEFAULTS.dashboardCustomization);
    expect(resolveFeatureFlag("dashboardCustomization", "")).toBe(false);
  });

  it("sobrescreve o default quando o valor é reconhecido", () => {
    expect(resolveFeatureFlag("dashboardCustomization", "true")).toBe(true);
    expect(resolveFeatureFlag("dashboardCustomization", "false")).toBe(false);
  });
});
