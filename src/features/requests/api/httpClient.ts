import type {
  ApiRequest,
  ApiResponse,
  AuthType,
  RequestBodyType,
  RequestOptions,
} from "@/contracts/api";
import type { Environment } from "@/types/workspace";
import { environmentVariablesToMap, resolveVariables } from "@/lib/variables";

export interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

export interface QueryParam {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Auth {
  type: AuthType;
  credentialRef?: string;
}

export interface Body {
  type: RequestBodyType;
  content?: string;
  fileRef?: string;
}

export interface ExecutableRequest {
  method: string;
  url: string;
  headers: Header[];
  queryParams: QueryParam[];
  body?: Body;
  auth?: Auth;
  options: RequestOptions;
}

export const DEFAULT_REQUEST_OPTIONS: RequestOptions = {
  timeoutMs: 30000,
  followRedirects: true,
  maxRedirects: 10,
  tlsVerification: true,
  maxResponseBytes: 10485760,
};

function contentTypeFor(bodyType: RequestBodyType): string {
  switch (bodyType) {
    case "json":
      return "application/json";
    case "xml":
      return "application/xml";
    case "form":
      return "application/x-www-form-urlencoded";
    case "multipart":
      return "multipart/form-data";
    case "binary":
      return "application/octet-stream";
    default:
      return "text/plain";
  }
}

/** Translates a persisted ApiRequest + Environment into a concrete executable request. */
export function buildExecutableRequest(
  request: ApiRequest,
  environment: Environment,
): ExecutableRequest {
  const variables = environmentVariablesToMap(environment);
  const url = resolveVariables(request.url, variables);
  const headers: Header[] = (request.headers ?? [])
    .filter((header) => header.enabled)
    .map((header) => ({
      ...header,
      value: resolveVariables(header.value, variables),
    }));
  const queryParams: QueryParam[] = (request.queryParams ?? [])
    .filter((param) => param.enabled)
    .map((param) => ({
      ...param,
      value: resolveVariables(param.value, variables),
    }));
  const body =
    request.body && request.body.type !== "none"
      ? {
          ...request.body,
          content: request.body.content
            ? resolveVariables(request.body.content, variables)
            : undefined,
        }
      : request.body;

  return {
    method: request.method,
    url,
    headers,
    queryParams,
    body,
    auth: request.auth,
    options: request.options ?? DEFAULT_REQUEST_OPTIONS,
  };
}

export function withQueryParams(url: string, queryParams: QueryParam[]): string {
  const active = queryParams.filter((param) => param.enabled && param.key);
  if (active.length === 0) return url;
  const search = new URLSearchParams();
  for (const param of active) {
    search.set(param.key, param.value);
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${search.toString()}`;
}

function applyAuth(
  headers: Headers,
  auth: Auth | undefined,
  environment: Environment,
): void {
  if (!auth || auth.type === "none") return;
  const variables = environmentVariablesToMap(environment);
  switch (auth.type) {
    case "bearer": {
      const token = variables[auth.credentialRef ?? "bearer_token"] ?? "";
      if (token) headers.set("Authorization", `Bearer ${token}`);
      break;
    }
    case "apiKey": {
      const key = variables[auth.credentialRef ?? "api_key"] ?? "";
      const headerName = variables["apiKeyHeader"] ?? "X-API-Key";
      if (key) headers.set(headerName, key);
      break;
    }
    case "basic": {
      const username = variables["basic_username"] ?? "";
      const password = variables["basic_password"] ?? "";
      headers.set("Authorization", `Basic ${btoa(`${username}:${password}`)}`);
      break;
    }
    default:
      throw new Error(
        `Auth type "${auth.type}" is not supported by the execution engine yet`,
      );
  }
}

export interface ExecutionOutcome {
  response: ApiResponse;
  finalUrl: string;
  bodyText: string;
}

/**
 * Executes an API request through the trusted execution engine.
 * Web implementation of the Rust execution engine: fetch + abortable timeout,
 * bounded response size, timing metrics, and response contract mapping.
 */
export async function executeApiRequest(
  request: ApiRequest,
  environment: Environment,
): Promise<ExecutionOutcome> {
  const executable = buildExecutableRequest(request, environment);
  const finalUrl = withQueryParams(executable.url, executable.queryParams);
  const headers = new Headers();
  for (const header of executable.headers) {
    headers.set(header.key, header.value);
  }
  applyAuth(headers, executable.auth, environment);

  const hasBody =
    Boolean(executable.body) &&
    executable.body?.type !== "none" &&
    executable.body?.content !== undefined &&
    executable.body.content !== "";
  if (hasBody && executable.body) {
    headers.set("Content-Type", contentTypeFor(executable.body.type));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    executable.options.timeoutMs,
  );
  const startedAt = performance.now();

  try {
    const fetchResponse = await fetch(finalUrl, {
      method: executable.method,
      headers,
      body: hasBody ? executable.body?.content : undefined,
      redirect: executable.options.followRedirects ? "follow" : "manual",
      signal: controller.signal,
    });

    const durationMs = Math.round(performance.now() - startedAt);
    const bodyText = await fetchResponse.text();
    const sizeBytes = new TextEncoder().encode(bodyText).length;
    const truncated = sizeBytes > executable.options.maxResponseBytes;
    const storedBody = truncated
      ? bodyText.slice(0, executable.options.maxResponseBytes)
      : bodyText;

    const responseHeaders: Record<string, string[]> = {};
    fetchResponse.headers.forEach((value, key) => {
      responseHeaders[key] = [value];
    });

    const response: ApiResponse = {
      requestId: request.id,
      status: fetchResponse.status,
      statusText: fetchResponse.statusText,
      headers: responseHeaders,
      durationMs,
      bodyPreview: storedBody,
      truncated,
      sizeBytes,
    };

    return { response, finalUrl, bodyText };
  } catch (error) {
    const timeoutMessage = `Request timed out after ${executable.options.timeoutMs}ms`;
    if (controller.signal.aborted) {
      throw new Error(timeoutMessage);
    }
    if (error instanceof Error) {
      throw new Error(
        error.name === "AbortError" ? timeoutMessage : error.message || timeoutMessage,
      );
    }
    throw new Error("Network error");
  } finally {
    clearTimeout(timeoutId);
  }
}
