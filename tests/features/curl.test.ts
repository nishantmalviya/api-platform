import { describe, expect, it } from "vitest";
import { generateCurlCommand, parseCurlCommand } from "@/features/requests/api/curl";
import type { ApiRequest, RequestOptions } from "@/contracts/api";
import type { Environment } from "@/types/workspace";

const environment: Environment = {
  id: "env_development",
  name: "Development",
  variables: [
    { key: "baseUrl", value: "http://localhost:8080", secret: false },
    { key: "bearer_token", value: "dev_token", secret: true },
  ],
};

const request: ApiRequest = {
  id: "req_test",
  name: "Create Payment",
  method: "POST",
  url: "{{baseUrl}}/payments",
  headers: [
    { key: "Authorization", value: "Bearer {{bearer_token}}", enabled: true },
    { key: "Content-Type", value: "application/json", enabled: true },
  ],
  queryParams: [],
  body: { type: "json", content: JSON.stringify({ amount: 100 }) },
  auth: { type: "bearer", credentialRef: "bearer_token" },
  options: {
    timeoutMs: 30000,
    followRedirects: true,
    maxRedirects: 10,
    tlsVerification: true,
    maxResponseBytes: 10485760,
  } as RequestOptions,
};

describe("generateCurlCommand", () => {
  it("generates a cURL command with method, auth and body", () => {
    const command = generateCurlCommand(request, environment);
    expect(command).toContain("curl -X POST");
    expect(command).toContain("http://localhost:8080/payments");
    expect(command).toContain("Authorization: Bearer dev_token");
    expect(command).toContain("Content-Type: application/json");
    expect(command).toContain('{"amount":100}');
  });
});

describe("parseCurlCommand", () => {
  it("parses method, url, headers, body and auth", () => {
    const parsed = parseCurlCommand(
      `curl -X POST 'http://localhost:8080/payments' -H 'Content-Type: application/json' -H 'Authorization: Bearer dev_token' -d '{"amount":100}'`,
    );
    expect(parsed.method).toBe("POST");
    expect(parsed.url).toBe("http://localhost:8080/payments");
    expect(parsed.body?.type).toBe("json");
    expect(parsed.auth?.type).toBe("bearer");
    expect(parsed.headers).toHaveLength(2);
  });
});
