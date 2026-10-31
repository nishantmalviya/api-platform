import { load as loadYaml } from "js-yaml";
import type { ApiRequest, AuthType, HttpMethod, RequestBodyType } from "@/contracts/api";
import type { Environment } from "@/types/workspace";
import { DEFAULT_REQUEST_OPTIONS } from "@/features/requests/api/httpClient";
import { environmentVariablesToMap, resolveVariables } from "@/lib/variables";

export const OPENAPI_HTTP_METHODS: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

export interface OpenApiParameter {
  name: string;
  in: "path" | "query" | "header";
  required: boolean;
  schema?: Record<string, unknown>;
  example?: unknown;
  description?: string;
}

export interface OpenApiRequestBody {
  contentType: string;
  schemaName?: string;
  example?: unknown;
}

export interface OpenApiSecurity {
  type: "apiKey" | "http" | "oauth2" | "basic" | "mtls" | "none";
  scheme?: string;
  name?: string;
  in?: string;
}

export interface OpenApiOperation {
  method: HttpMethod;
  path: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags: string[];
  parameters: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  security?: OpenApiSecurity[];
}

/** Parses an OpenAPI 3.x document supplied as JSON or YAML text. */
export function parseOpenApiDocument(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("OpenAPI document is empty");
  }
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const parsed = loadYaml(trimmed);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Invalid OpenAPI document: expected a YAML object");
    }
    return parsed as Record<string, unknown>;
  }
}

function extractParameters(raw: unknown): OpenApiParameter[] {
  if (!Array.isArray(raw)) return [];
  const parameters: OpenApiParameter[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue;
    const candidate = entry as Record<string, unknown>;
    const name = typeof candidate.name === "string" ? candidate.name : "";
    const inValue = candidate.in === "path" || candidate.in === "query" || candidate.in === "header"
      ? candidate.in
      : "query";
    parameters.push({
      name,
      in: inValue,
      required: candidate.required === true,
      schema: typeof candidate.schema === "object" && candidate.schema !== null
        ? (candidate.schema as Record<string, unknown>)
        : undefined,
      example:
        candidate.example === undefined ? undefined : candidate.example,
      description:
        typeof candidate.description === "string" ? candidate.description : undefined,
    });
  }
  return parameters;
}

function extractRequestBody(raw: unknown): OpenApiRequestBody | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const candidate = raw as Record<string, unknown>;
  const content = typeof candidate.content === "object" && candidate.content !== null
    ? (candidate.content as Record<string, unknown>)
    : {};
  const contentType = Object.keys(content)[0];
  if (!contentType) return undefined;
  const mediaType = content[contentType] as Record<string, unknown> | undefined;
  const schema = typeof mediaType?.schema === "object" && mediaType?.schema !== null
    ? (mediaType.schema as Record<string, unknown>)
    : undefined;
  const example =
    mediaType?.example === undefined && schema?.example !== undefined
      ? schema.example
      : (mediaType?.example as unknown);
  return {
    contentType,
    schemaName: undefined,
    example: example as unknown,
  };
}

function extractSecurity(raw: unknown): OpenApiSecurity[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const schemes: OpenApiSecurity[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue;
    const candidate = entry as Record<string, unknown>;
    const type = (
      ["apiKey", "http", "oauth2", "basic", "mtls", "none"].includes(
        String(candidate.type),
      )
        ? candidate.type
        : "none"
    ) as OpenApiSecurity["type"];
    schemes.push({
      type,
      scheme: typeof candidate.scheme === "string" ? candidate.scheme : undefined,
      name: typeof candidate.name === "string" ? candidate.name : undefined,
      in: typeof candidate.in === "string" ? candidate.in : undefined,
    });
  }
  return schemes.length > 0 ? schemes : undefined;
}

/** Extracts all HTTP operations from an OpenAPI paths object. */
export function extractOpenApiOperations(
  document: Record<string, unknown>,
): OpenApiOperation[] {
  const paths = (document.paths ?? {}) as Record<string, Record<string, unknown>>;
  const operations: OpenApiOperation[] = [];
  for (const [path, methods] of Object.entries(paths)) {
    if (typeof methods !== "object" || methods === null) continue;
    const methodMap = methods as Record<string, unknown>;
    for (const method of OPENAPI_HTTP_METHODS) {
      const operation = methodMap[method.toLowerCase()];
      if (typeof operation !== "object" || operation === null) continue;
      const candidate = operation as Record<string, unknown>;
      operations.push({
        method,
        path,
        operationId: typeof candidate.operationId === "string" ? candidate.operationId : `${method} ${path}`,
        summary: typeof candidate.summary === "string" ? candidate.summary : undefined,
        description: typeof candidate.description === "string" ? candidate.description : undefined,
        tags:
          Array.isArray(candidate.tags)
            ? candidate.tags.filter((tag): tag is string => typeof tag === "string")
            : [],
        parameters: extractParameters(candidate.parameters),
        requestBody: extractRequestBody(candidate.requestBody),
        security: extractSecurity(candidate.security),
      });
    }
  }
  return operations;
}

function contentTypeToBodyType(contentType: string): RequestBodyType {
  const normalized = contentType.toLowerCase();
  if (normalized.includes("json")) return "json";
  if (normalized.includes("xml")) return "xml";
  if (normalized.includes("x-www-form-urlencoded")) return "form";
  if (normalized.includes("multipart")) return "multipart";
  return "text";
}

function authFromSecurity(
  security: OpenApiSecurity[] | undefined,
): { type: AuthType; credentialRef?: string } | undefined {
  if (!security || security.length === 0) return undefined;
  const first = security[0];
  if (first.type === "http") {
    if (first.scheme === "bearer") {
      return { type: "bearer", credentialRef: "bearer_token" };
    }
    if (first.scheme === "basic") {
      return { type: "basic", credentialRef: "basic_username" };
    }
    if (first.scheme) {
      return { type: "apiKey", credentialRef: first.scheme };
    }
  }
  if (first.type === "apiKey") {
    return { type: "apiKey", credentialRef: first.name ?? "apiKey" };
  }
  if (first.type === "oauth2") {
    return { type: "oauth2", credentialRef: "oauth2_token" };
  }
  if (first.type === "basic") {
    return { type: "basic", credentialRef: "basic_username" };
  }
  if (first.type === "mtls") {
    return { type: "mtls" };
  }
  return undefined;
}

/**
 * Generates an executable ApiRequest from a single OpenAPI operation,
 * resolving path/query/header parameters and body examples against the environment.
 */
export function generateApiRequestFromOperation(
  operation: OpenApiOperation,
  environment: Environment,
): Omit<ApiRequest, "id"> {
  const variables = environmentVariablesToMap(environment);

  const pathParams: Record<string, string> = {};
  for (const param of operation.parameters.filter(
    (item) => item.in === "path" && item.required,
  )) {
    pathParams[param.name] = param.example !== undefined ? String(param.example) : `generated_${param.name}`;
  }

  const resolvedPath = resolveVariables(
    operation.path.replace(/\{([^}/]+)\}/g, ":$1"),
    variables,
    pathParams,
  );
  const url = `${variables["baseUrl"] ?? ""}${resolvedPath}`;

  const queryParams = operation.parameters
    .filter((item) => item.in === "query")
    .map((item) => ({
      key: item.name,
      value: item.example !== undefined ? String(item.example) : "",
      enabled: true,
    }));

  const headers = operation.parameters
    .filter((item) => item.in === "header")
    .map((item) => ({
      key: item.name,
      value: item.example !== undefined ? String(item.example) : "",
      enabled: true,
    }));

  const bodyType: RequestBodyType = operation.requestBody
    ? contentTypeToBodyType(operation.requestBody.contentType)
    : "none";
  const body =
    operation.requestBody && bodyType !== "none" && operation.requestBody.example !== undefined
      ? {
          type: bodyType,
          content: JSON.stringify(operation.requestBody.example, null, 2),
        }
      : undefined;

  const auth = authFromSecurity(operation.security);

  return {
    name: operation.operationId ?? `${operation.method} ${operation.path}`,
    method: operation.method,
    url,
    headers,
    queryParams,
    ...(body ? { body } : {}),
    ...(auth ? { auth } : {}),
    environmentId: environment.id,
    options: { ...DEFAULT_REQUEST_OPTIONS },
  };
}
