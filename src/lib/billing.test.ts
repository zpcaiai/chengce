import { describe, it, expect } from "vitest";
import { planFromMetadata, seatsFromMetadata } from "@/lib/billing";

describe("billing metadata mapping", () => {
  it("maps valid plans case-insensitively", () => {
    expect(planFromMetadata({ plan: "diagnostic" })).toBe("DIAGNOSTIC");
    expect(planFromMetadata({ plan: "DELIVERY" })).toBe("DELIVERY");
    expect(planFromMetadata({ plan: "Continuity" })).toBe("CONTINUITY");
  });
  it("falls back for missing or invalid plans", () => {
    expect(planFromMetadata(undefined)).toBe("CONTINUITY");
    expect(planFromMetadata({ plan: "enterprise" })).toBe("CONTINUITY");
    expect(planFromMetadata({}, "DELIVERY")).toBe("DELIVERY");
  });
  it("reads seats from metadata, then quantity, then fallback", () => {
    expect(seatsFromMetadata({ seats: "5" })).toBe(5);
    expect(seatsFromMetadata({}, 8)).toBe(8);
    expect(seatsFromMetadata({}, null)).toBe(1);
    expect(seatsFromMetadata({ seats: "abc" })).toBe(1);
  });
});
