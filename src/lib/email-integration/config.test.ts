import { afterEach, describe, expect, it } from "vitest";
import {
  emailIntegrationAvailable,
  emailOAuthAvailable,
  emailSmtpAvailable,
} from "./config";

const env = process.env;

afterEach(() => {
  process.env = { ...env };
});

describe("email integration availability", () => {
  it("SMTP is available with only encryption key and project id", () => {
    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    process.env.EMAIL_CREDENTIALS_ENC_KEY = "a".repeat(32);
    process.env.NEXT_PUBLIC_PROJECT_ID = "psy-test";
    expect(emailSmtpAvailable()).toBe(true);
    expect(emailOAuthAvailable()).toBe(false);
    expect(emailIntegrationAvailable()).toBe(true);
  });

  it("OAuth requires Google client credentials", () => {
    process.env.EMAIL_CREDENTIALS_ENC_KEY = "a".repeat(32);
    process.env.NEXT_PUBLIC_PROJECT_ID = "psy-test";
    process.env.GOOGLE_OAUTH_CLIENT_ID = "client";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "secret";
    expect(emailOAuthAvailable()).toBe(true);
    expect(emailIntegrationAvailable()).toBe(true);
  });

  it("nothing available without encryption key", () => {
    delete process.env.EMAIL_CREDENTIALS_ENC_KEY;
    process.env.NEXT_PUBLIC_PROJECT_ID = "psy-test";
    process.env.GOOGLE_OAUTH_CLIENT_ID = "client";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "secret";
    expect(emailSmtpAvailable()).toBe(false);
    expect(emailOAuthAvailable()).toBe(false);
    expect(emailIntegrationAvailable()).toBe(false);
  });
});
