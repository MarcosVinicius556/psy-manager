import type { MultiFactorResolver } from "firebase/auth";

export class MfaSignInRequired extends Error {
  readonly resolver: MultiFactorResolver;

  constructor(resolver: MultiFactorResolver) {
    super("MFA_REQUIRED");
    this.name = "MfaSignInRequired";
    this.resolver = resolver;
  }
}

export function isMfaSignInRequired(error: unknown): error is MfaSignInRequired {
  return error instanceof MfaSignInRequired;
}
