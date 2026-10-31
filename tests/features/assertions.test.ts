import { describe, expect, it } from "vitest";
import { runResponseAssertions } from "@/features/requests/lib/assertions";
import type { ApiRequest, ApiResponse } from "@/contracts/api";

const request: ApiRequest = {
  id: "req_test",
  name: "Get Payment",
  method: "GET",
  url: "{{baseUrl}}/payments/pay_123",
  headers: [],
  queryParams: [],
  options: {
    timeoutMs: 30000,
    followRedirects: true,
    maxRedirects: 10,
    tlsVerification: true,
    maxResponseBytes: 10485760,
  },
};

const response: ApiResponse = {
  requestId: "req_test",
  status: 200,
  statusText: "OK",
  headers: { "Content-Type": ["application/json"] },
  durationMs: 42,
  bodyPreview: JSON.stringify({ id: "pay_123", amount: 100 }),
  truncated: false,
  sizeBytes: 38,
};

describe("runResponseAssertions", () => {
  it("passes status assertions", () => {
    const results = runResponseAssertions(request, response, [
      { id: "a1", type: "status", expectedStatus: 200 },
      { id: "a2", type: "status", expectedStatus: 500 },
    ]);
    expect(results[0].passed).toBe(true);
    expect(results[1].passed).toBe(false);
  });

  it("validates response time assertions", () => {
    const results = runResponseAssertions(request, response, [
      { id: "a1", type: "responseTime", maxDurationMs: 100 },
      { id: "a2", type: "responseTime", maxDurationMs: 10 },
    ]);
    expect(results[0].passed).toBe(true);
    expect(results[1].passed).toBe(false);
  });

  it("validates JSON path assertions", () => {
    const results = runResponseAssertions(request, response, [
      { id: "a1", type: "jsonPath", jsonPath: "$.amount", expectedValue: 100 },
      { id: "a2", type: "jsonPath", jsonPath: "$.missing", expectedValue: 1 },
    ]);
    expect(results[0].passed).toBe(true);
    expect(results[1].passed).toBe(false);
  });
});
