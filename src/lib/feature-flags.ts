/**
 * Feature toggles driven by `NEXT_PUBLIC_FEATURE_<NAME>` env vars.
 * Set to `true` or `1` (case-insensitive) to enable; anything else leaves the default.
 */

export const FEATURE_FLAG_DEFAULTS = {
  dashboardCustomization: true,
} as const;

export type FeatureFlagName = keyof typeof FEATURE_FLAG_DEFAULTS;

/** Maps a registry key to the public env var name (e.g. dashboardCustomization → NEXT_PUBLIC_FEATURE_DASHBOARD_CUSTOMIZATION). */
export function featureFlagEnvKey(name: FeatureFlagName): string {
  const snake = name.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase();
  return `NEXT_PUBLIC_FEATURE_${snake}`;
}

/** Parses a raw env string; only `true` and `1` (any casing) enable the flag. */
export function parseFeatureFlagValue(raw: string | undefined | null): boolean {
  if (raw == null || raw === "") return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === "true" || normalized === "1";
}

/** Resolves one flag from an optional raw env value, falling back to the registry default when unset. */
export function resolveFeatureFlag(name: FeatureFlagName, raw: string | undefined | null): boolean {
  if (raw == null || raw === "") return FEATURE_FLAG_DEFAULTS[name];
  return parseFeatureFlagValue(raw);
}

function readEnv(name: FeatureFlagName): string | undefined {
  const key = featureFlagEnvKey(name);
  return process.env[key];
}

function buildFeatureFlags(): Record<FeatureFlagName, boolean> {
  const flags = {} as Record<FeatureFlagName, boolean>;
  for (const name of Object.keys(FEATURE_FLAG_DEFAULTS) as FeatureFlagName[]) {
    flags[name] = resolveFeatureFlag(name, readEnv(name));
  }
  return flags;
}

/** Snapshot of all flags for the current build / runtime. */
export const featureFlags: Readonly<Record<FeatureFlagName, boolean>> = Object.freeze(buildFeatureFlags());
