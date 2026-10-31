import { describe, expect, it } from "vitest";
import {
  environmentVariablesToMap,
  resolveVariables,
} from "@/lib/variables";

describe("resolveVariables", () => {
  it("substitutes environment variables into urls", () => {
    const variables = {
      baseUrl: "http://localhost:8080",
      bearer_token: "token",
    };

    expect(resolveVariables("{{baseUrl}}/payments", variables)).toBe(
      "http://localhost:8080/payments",
    );
  });

  it("substitutes path parameters", () => {
    expect(resolveVariables("/payments/:id", { id: "pay_123" })).toBe(
      "/payments/pay_123",
    );
  });

  it("keeps unresolved placeholders for empty values", () => {
    expect(resolveVariables("{{baseUrl}}/payments", { baseUrl: "" })).toBe(
      "{{baseUrl}}/payments",
    );
  });
});

describe("environmentVariablesToMap", () => {
  it("builds a lookup map from environment variables", () => {
    const map = environmentVariablesToMap({
      variables: [
        { key: "baseUrl", value: "https://api.example.com", secret: false },
        { key: "apiKey", value: "sk_test_123", secret: true },
      ],
    });

    expect(map.baseUrl).toBe("https://api.example.com");
    expect(map.apiKey).toBe("sk_test_123");
  });
});
