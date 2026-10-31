import type { ApiRequest, ApiResponse } from "@/contracts/api";

export type AssertionType =
  | "status"
  | "header"
  | "responseTime"
  | "jsonPath"
  | "bodyValue";

export interface ResponseAssertion {
  id: string;
  type: AssertionType;
  expectedStatus?: number;
  headerKey?: string;
  headerExpected?: string;
  maxDurationMs?: number;
  jsonPath?: string;
  expectedValue?: unknown;
}

export interface AssertionResult {
  assertion: ResponseAssertion;
  passed: boolean;
  actual?: unknown;
  message: string;
}

function deepEqual(primary: unknown, secondary: unknown): boolean {
  if (primary === secondary) return true;
  if (typeof primary !== typeof secondary) return false;
  if (typeof primary !== "object" || primary === null || typeof secondary !== "object" || secondary === null) {
    return false;
  }
  if (Array.isArray(primary) || Array.isArray(secondary)) {
    if (!Array.isArray(primary) || !Array.isArray(secondary)) return false;
    if (primary.length !== secondary.length) return false;
    return primary.every((item, index) => deepEqual(item, secondary[index]));
  }
  const primaryRecord = primary as Record<string, unknown>;
  const secondaryRecord = secondary as Record<string, unknown>;
  const keys = new Set([...Object.keys(primaryRecord), ...Object.keys(secondaryRecord)]);
  if (keys.size !== Object.keys(primaryRecord).length) return false;
  for (const key of Object.keys(primaryRecord)) {
    if (!deepEqual(primaryRecord[key], secondaryRecord[key])) return false;
  }
  return true;
}

function resolveJsonPath(document: unknown, path: string): { found: boolean; value?: unknown } {
  const trimmed = path.trim();
  if (!trimmed) return { found: false };
  const segments = trimmed.replace(/^\$/, "").split(".").filter((segment) => segment.length > 0);
  let current: unknown = document;
  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (Number.isNaN(index)) return { found: false };
      current = current[index];
    } else if (typeof current === "object" && current !== null) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return { found: false };
    }
  }
  return { found: true, value: current };
}

function parseBody(response: ApiResponse | undefined): unknown {
  if (!response?.bodyPreview) return undefined;
  try {
    return JSON.parse(response.bodyPreview);
  } catch {
    return undefined;
  }
}

/** Runs visual assertions against a captured response. */
export function runResponseAssertions(
  request: ApiRequest,
  response: ApiResponse | undefined,
  assertions: ResponseAssertion[],
): AssertionResult[] {
  const results: AssertionResult[] = [];
  for (const assertion of assertions) {
    if (assertion.type === "status") {
      const expectedStatus = assertion.expectedStatus ?? 0;
      const passed = response !== undefined && response.status === expectedStatus;
      results.push({
        assertion,
        passed,
        actual: response?.status,
        message:
          response === undefined
            ? `No response captured for ${request.method} ${request.url}`
            : `Expected status ${expectedStatus} but received ${response.status}`,
      });
      continue;
    }
    if (assertion.type === "header") {
      const key = assertion.headerKey ?? "";
      const expected = assertion.headerExpected ?? "";
      const actualValue = response?.headers[key]?.[0] ?? "";
      const passed = Boolean(response) && actualValue === expected;
      results.push({
        assertion,
        passed,
        actual: actualValue,
        message: `Expected header ${key} to be "${expected}" but received "${actualValue}"`,
      });
      continue;
    }
    if (assertion.type === "responseTime") {
      const maxDurationMs = assertion.maxDurationMs ?? Number.POSITIVE_INFINITY;
      const passed = response !== undefined && response.durationMs <= maxDurationMs;
      results.push({
        assertion,
        passed,
        actual: response?.durationMs,
        message: `Expected response time <= ${maxDurationMs}ms but received ${response?.durationMs ?? "n/a"}ms`,
      });
      continue;
    }
    if (assertion.type === "jsonPath" || assertion.type === "bodyValue") {
      const body = parseBody(response);
      const path = assertion.jsonPath ?? "$";
      const resolved = resolveJsonPath(body, path);
      const expectedValue = assertion.expectedValue;
      const passed = resolved.found && deepEqual(resolved.value, expectedValue);
      results.push({
        assertion,
        passed,
        actual: resolved.found ? resolved.value : undefined,
        message: resolved.found
          ? `Expected value at ${path} to be ${JSON.stringify(expectedValue)} but received ${JSON.stringify(resolved.value)}`
          : `JSON path ${path} was not found in the response body`,
      });
      continue;
    }
    results.push({
      assertion,
      passed: false,
      message: `Unsupported assertion type ${assertion.type}`,
    });
  }
  return results;
}
