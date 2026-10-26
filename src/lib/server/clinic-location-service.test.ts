import { describe, expect, it } from "vitest";
import { locationProfessionalUids } from "./clinic-location-service";

describe("locationProfessionalUids", () => {
  it("includes owner and members without duplicates", () => {
    expect(
      locationProfessionalUids({
        createdByUid: "owner-1",
        memberUids: ["owner-1", "pro-2", "pro-3"],
      })
    ).toEqual(["owner-1", "pro-2", "pro-3"]);
  });

  it("handles missing fields", () => {
    expect(locationProfessionalUids({})).toEqual([]);
  });
});
