import { describe, expect, it } from "vitest";
import {
  publicBookingLoadPhaseFromNetworkFailure,
  publicBookingLoadPhaseFromResponse,
} from "./public-booking-load";

describe("publicBookingLoadPhaseFromResponse", () => {
  it("maps 404 to unavailable (Link indisponível)", () => {
    expect(publicBookingLoadPhaseFromResponse({ ok: false, status: 404 })).toBe("unavailable");
  });

  it("maps other HTTP errors to error", () => {
    expect(publicBookingLoadPhaseFromResponse({ ok: false, status: 500 })).toBe("error");
    expect(publicBookingLoadPhaseFromResponse({ ok: false, status: 403 })).toBe("error");
  });

  it("maps success to ready", () => {
    expect(publicBookingLoadPhaseFromResponse({ ok: true, status: 200 })).toBe("ready");
  });
});

describe("publicBookingLoadPhaseFromNetworkFailure", () => {
  it("maps network failure to error", () => {
    expect(publicBookingLoadPhaseFromNetworkFailure()).toBe("error");
  });
});
