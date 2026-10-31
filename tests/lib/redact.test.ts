import { describe, expect, it } from "vitest";
import { redactForStorage, redactHeaders, redactJsonText } from "@/lib/redact";

describe("redact", () => {
  it("redacts sensitive keys from json bodies", () => {
    const redacted = redactJsonText(
      JSON.stringify({ amount: 100, accessToken: "super-secret", user: "test" }),
    );

    expect(redacted).toContain("[REDACTED]");
    expect(redacted).not.toContain("super-secret");
    expect(redacted).toContain("100");
  });

  it("redacts bearer tokens from plain text", () => {
    expect(redactForStorage("Bearer super-secret-token")).toBe(
      "Bearer [REDACTED]",
    );
  });

  it("redacts sensitive headers", () => {
    const headers = redactHeaders([
      { key: "Authorization", value: "Bearer super-secret", enabled: true },
      { key: "Content-Type", value: "application/json", enabled: true },
    ]);

    expect(headers[0]?.value).toBe("[REDACTED]");
    expect(headers[1]?.value).toBe("application/json");
  });
});
