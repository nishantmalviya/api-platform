const SENSITIVE_KEY_PATTERN =
  /(authorization|proxy[-_]?authorization|cookie|set[-_]?cookie|token|secret|password|credential|api[-_]?key|private[-_]?key|access[-_]?token|refresh[-_]?token|session)/i;

const BEARER_PATTERN = /bearer\s+[A-Za-z0-9\-._~+/=]+/gi;
const BASIC_PATTERN = /basic\s+[A-Za-z0-9+/=]+/gi;

export function redactString(text: string): string {
  return text
    .replace(BEARER_PATTERN, "Bearer [REDACTED]")
    .replace(BASIC_PATTERN, "Basic [REDACTED]");
}

export function redactUnknown(value: unknown): unknown {
  if (typeof value === "string") {
    return redactString(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactUnknown(item));
  }
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(
      value as Record<string, unknown>,
    )) {
      output[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? "[REDACTED]"
        : redactUnknown(entry);
    }
    return output;
  }
  return value;
}

/** Redacts a JSON encoded string for persistence in history / AI context. */
export function redactJsonText(text: string): string {
  try {
    const parsed: unknown = JSON.parse(text);
    return JSON.stringify(redactUnknown(parsed));
  } catch {
    // Not valid JSON — fall back to pattern based redaction.
    return redactString(text);
  }
}

export function redactHeaders(
  headers: Array<{ key: string; value: string; enabled: boolean }>,
): Array<{ key: string; value: string; enabled: boolean }> {
  const sensitiveKeys = new Set([
    "authorization",
    "proxy-authorization",
    "cookie",
    "set-cookie",
    "www-authenticate",
  ]);
  return headers.map((header) => ({
    ...header,
    value: sensitiveKeys.has(header.key.toLowerCase())
      ? "[REDACTED]"
      : header.value,
  }));
}

/** Deep redaction for arbitrary persisted payloads (e.g. AI context packages). */
export function redactForStorage<T>(value: T): T {
  return redactUnknown(value) as T;
}
