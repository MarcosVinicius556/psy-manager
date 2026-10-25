import { describe, expect, it } from "vitest";
import { paymentConfirmationMarkerId } from "./idempotency";

describe("email idempotency keys", () => {
  it("uses stable payment marker id", () => {
    expect(paymentConfirmationMarkerId("pay-1")).toBe("payment_pay-1_confirmacao");
  });
});
