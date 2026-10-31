import { describe, expect, it } from "vitest";
import { diffJsonSemantic, diffTextLines, summarizeDiff } from "@/features/requests/lib/diff";

describe("diffJsonSemantic", () => {
  it("reports no differences for equal objects", () => {
    const entries = diffJsonSemantic({ amount: 100, currency: "USD" }, { amount: 100, currency: "USD" });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual(expect.objectContaining({ type: "same", path: "$" }));
  });

  it("detects changed and added values with paths", () => {
    const entries = diffJsonSemantic(
      { amount: 100, currency: "USD" },
      { amount: 250, currency: "USD", receiptId: "rcpt_1" },
    );
    const changed = entries.filter((entry) => entry.type === "changed");
    expect(changed).toHaveLength(1);
    expect(changed[0].path).toBe("$/amount");
    expect(changed[0].primaryValue).toBe(100);
    expect(changed[0].secondaryValue).toBe(250);

    const added = entries.filter((entry) => entry.type === "added");
    expect(added).toHaveLength(1);
    expect(added[0].path).toBe("$/receiptId");
  });
});

describe("diffTextLines", () => {
  it("computes line-based additions and removals", () => {
    const entries = diffTextLines('{\n  "a": 1\n}', '{\n  "a": 2\n}');
    const removed = entries.filter((entry) => entry.type === "removed");
    const added = entries.filter((entry) => entry.type === "added");
    expect(removed).toHaveLength(1);
    expect(added).toHaveLength(1);
  });
});

describe("summarizeDiff", () => {
  it("counts diff entry types", () => {
    const summary = summarizeDiff([
      { type: "same", path: "$" },
      { type: "changed", path: "/amount" },
      { type: "added", path: "/receiptId" },
      { type: "removed", path: "/oldField" },
    ]);
    expect(summary).toEqual({ added: 1, removed: 1, changed: 1, same: 1 });
  });
});
