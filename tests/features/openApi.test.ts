import { describe, expect, it } from "vitest";
import {
  extractOpenApiOperations,
  generateApiRequestFromOperation,
  parseOpenApiDocument,
} from "@/features/openapi/lib/openApi";
import type { Environment } from "@/types/workspace";

const paymentsDocument = {
  openapi: "3.0.0",
  info: { title: "Payments API", version: "1.0.0" },
  paths: {
    "/payments": {
      get: {
        operationId: "listPayments",
        summary: "List payments",
        tags: ["Payments"],
      },
      post: {
        operationId: "createPayment",
        summary: "Create payment",
        tags: ["Payments"],
        requestBody: {
          content: { "application/json": { example: { amount: 100 } } },
        },
      },
    },
    "/payments/{paymentId}": {
      get: {
        operationId: "getPayment",
        summary: "Get payment",
        tags: ["Payments"],
        parameters: [{ name: "paymentId", in: "path", required: true, example: "pay_123" }],
      },
    },
  },
};

const environment: Environment = {
  id: "env_development",
  name: "Development",
  variables: [
    { key: "baseUrl", value: "http://localhost:8080", secret: false },
    { key: "bearer_token", value: "dev_token", secret: true },
  ],
};

describe("parseOpenApiDocument", () => {
  it("parses a JSON OpenAPI document", () => {
    const document = parseOpenApiDocument(JSON.stringify(paymentsDocument));
    expect((document.paths as Record<string, unknown>)["/payments"]).toBeDefined();
  });

  it("parses a YAML OpenAPI document", () => {
    const yaml = [
      "openapi: 3.0.0",
      "info:",
      "  title: Payments API",
      "  version: 1.0.0",
      "paths:",
      "  /healthz:",
      "    get:",
      "      operationId: healthCheck",
      "      tags: [Health]",
      "",
    ].join("\n");
    const document = parseOpenApiDocument(yaml);
    expect(document.openapi).toBe("3.0.0");
  });

  it("rejects empty documents", () => {
    expect(() => parseOpenApiDocument("   ")).toThrow();
  });
});

describe("extractOpenApiOperations", () => {
  it("extracts method operations from paths", () => {
    const operations = extractOpenApiOperations(paymentsDocument);
    expect(operations).toHaveLength(3);
    expect(operations.map((operation) => operation.method)).toEqual([
      "GET",
      "POST",
      "GET",
    ]);
    expect(operations[0].path).toBe("/payments");
    expect(operations[2].path).toBe("/payments/{paymentId}");
  });
});

describe("generateApiRequestFromOperation", () => {
  it("generates a resolved request with path parameters", () => {
    const operations = extractOpenApiOperations(paymentsDocument);
    const getPayment = operations[2];
    const input = generateApiRequestFromOperation(getPayment, environment);
    expect(input.method).toBe("GET");
    expect(input.url).toBe("http://localhost:8080/payments/pay_123");
  });

  it("generates a JSON request body for POST operations", () => {
    const operations = extractOpenApiOperations(paymentsDocument);
    const createPayment = operations[1];
    const input = generateApiRequestFromOperation(createPayment, environment);
    expect(input.method).toBe("POST");
    expect(input.body?.type).toBe("json");
    expect(JSON.parse(input.body?.content ?? "{}")).toEqual({ amount: 100 });
  });
});
