import { describe, expect, it } from "vitest";
import { ApiRequestSchema, HttpMethodSchema } from "@/contracts/api";

const validOptions = {
  timeoutMs: 30000,
  followRedirects: true,
  maxRedirects: 10,
  tlsVerification: true,
  maxResponseBytes: 10485760,
};

describe("ApiRequest contract", () => {
  it("accepts a valid request definition", () => {
    const result = ApiRequestSchema.safeParse({
      id: "req_1",
      name: "List Payments",
      method: "GET",
      url: "{{baseUrl}}/payments",
      headers: [],
      queryParams: [],
      options: validOptions,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a request without a url", () => {
    const result = ApiRequestSchema.safeParse({
      id: "req_1",
      name: "Broken",
      method: "GET",
      url: "",
      options: validOptions,
    });

    expect(result.success).toBe(false);
  });
});

describe("HttpMethod contract", () => {
  it("accepts the core REST methods", () => {
    for (const method of [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "HEAD",
      "OPTIONS",
    ]) {
      expect(HttpMethodSchema.safeParse(method).success).toBe(true);
    }
  });
});
