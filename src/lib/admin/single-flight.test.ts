import { describe, expect, it, vi } from "vitest";
import { resetSingleFlightStore, singleFlight } from "./single-flight";

describe("singleFlight", () => {
  it("reutiliza a mesma promessa para a mesma chave", async () => {
    resetSingleFlightStore();
    const run = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return "ok";
    });
    const [first, second] = await Promise.all([singleFlight("uid-1", run), singleFlight("uid-1", run)]);
    expect(first).toBe("ok");
    expect(second).toBe("ok");
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("libera a chave após concluir", async () => {
    resetSingleFlightStore();
    const run = vi.fn(async () => "done");
    await singleFlight("uid-2", run);
    await singleFlight("uid-2", run);
    expect(run).toHaveBeenCalledTimes(2);
  });
});
