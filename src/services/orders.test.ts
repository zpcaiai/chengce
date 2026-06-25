import { describe, it, expect } from "vitest";
import { serializeOrder } from "@/services/orders";

describe("order serialization", () => {
  it("converts a Decimal-like amount to a number and preserves other fields", () => {
    const decimalLike = { toString: () => "199", valueOf: () => 199 };
    const out = serializeOrder({ amount: decimalLike, id: "o1", title: "诊断版 · 按年" });
    expect(out.amount).toBe(199);
    expect(out.id).toBe("o1");
    expect(out.title).toBe("诊断版 · 按年");
    expect(typeof out.amount).toBe("number");
  });
});
