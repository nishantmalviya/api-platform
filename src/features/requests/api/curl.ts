import type { ApiRequest, AuthType, RequestBodyType } from "@/contracts/api";
import type { Environment } from "@/types/workspace";
import { environmentVariablesToMap, resolveVariables } from "@/lib/variables";

export interface CurlHeader {
  key: string;
  value: string;
}

export interface ParsedCurlRequest {
  method: string;
  url?: string;
  headers: CurlHeader[];
  queryParams: { key: string; value: string; enabled: boolean }[];
  body?: { type: RequestBodyType; content?: string };
  auth?: { type: AuthType; credentialRef?: string };
}

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

/** Generates a cURL command string for a saved request against an environment. */
export function generateCurlCommand(request: ApiRequest, environment: Environment): string {
  const variables = environmentVariablesToMap(environment);
  const url = resolveVariables(request.url, variables);
  const method = (request.method || "GET").toLowerCase();
  const parts: string[] = ["curl"];
  if (method !== "get") {
    parts.push("-X", method.toUpperCase());
  }
  parts.push(`'${url}'`);

  const activeHeaders = (request.headers ?? []).filter(
    (header) => header.enabled && header.key.trim() !== "",
  );
  const contentHeaders = activeHeaders.filter(
    (header) =>
      header.key.toLowerCase() !== "authorization" &&
      header.key.toLowerCase() !== "content-type",
  );
  for (const header of contentHeaders) {
    parts.push("-H", `'${header.key}: ${resolveVariables(header.value, variables)}'`);
  }

  const body = request.body;
  const hasBody = Boolean(body && body.type !== "none" && body.content);
  if (hasBody && body) {
    const contentType =
      contentHeaders.find((header) => header.key.toLowerCase() === "content-type")?.value ??
      contentTypeFor(body.type);
    parts.push("-H", `'Content-Type: ${contentType}'`);
    parts.push("-d", `'${body.content ?? ""}'`);
  }

  const auth = request.auth;
  if (auth && auth.type === "bearer") {
    const token = variables[auth.credentialRef ?? "bearer_token"] ?? "";
    parts.push("-H", `'Authorization: Bearer ${token}'`);
  } else if (auth && auth.type === "basic") {
    const username = variables["basic_username"] ?? "";
    const password = variables["basic_password"] ?? "";
    parts.push("-u", `${username}:${password}`);
  }

  return parts.join(" ");
}

/** Parses a cURL command string into the request fields used by the editor. */
export function parseCurlCommand(command: string): ParsedCurlRequest {
  const normalized = command.trim().replace(/^curl\s+/i, "").trim();
  const methodMatch =
    normalized.match(/(?:^|\s)-X(?:\s|=)(\S+)|(?:^|\s)-x(?:\s|=)(\S+)|(?:^|\s)--request(?:\s|=)(\S+)/i);
  const method = (
    methodMatch?.[1] ??
    methodMatch?.[2] ??
    methodMatch?.[3] ??
    "GET"
  ).toUpperCase();

  const urlMatch = normalized.match(/'([^']+)'|"([^"]+)"/);
  const url = (urlMatch?.[1] ?? urlMatch?.[2] ?? "").trim();

  const headers: CurlHeader[] = [];
  const headerRegex = /(?:^|\s)-H\s+'([^']+)'|-H\s+"([^"]+)"/gi;
  let headerMatch: RegExpExecArray | null;
  while ((headerMatch = headerRegex.exec(normalized)) !== null) {
    const keyValue = headerMatch[1] ?? headerMatch[2];
    const separatorIndex = keyValue.indexOf(":");
    if (separatorIndex <= 0) continue;
    headers.push({
      key: keyValue.slice(0, separatorIndex).trim(),
      value: keyValue.slice(separatorIndex + 1).trim(),
    });
  }

  const dataMatch = normalized.match(
    /(?:^|\s)(?:-d|--data(?:-raw|-binary)?)(?:\s|=)(?:'([^']*)'|"([^"]*)"|([^\s'"]+))/i,
  );
  const data = dataMatch?.[1] ?? dataMatch?.[2] ?? dataMatch?.[3] ?? "";
  const isJson = headers.some((header) => header.key.toLowerCase() === "content-type" && header.value.toLowerCase().includes("json"));
  const body = data
    ? {
        type: (isJson ? "json" : "text") as RequestBodyType,
        content: data,
      }
    : undefined;

  const authHeader = headers.find((header) => header.key.toLowerCase() === "authorization");
  const auth =
    authHeader && authHeader.value.toLowerCase().startsWith("bearer ")
      ? { type: "bearer" as AuthType, credentialRef: "bearer_token" }
      : authHeader && authHeader.value.toLowerCase().startsWith("basic ")
        ? { type: "basic" as AuthType, credentialRef: "basic_username" }
        : undefined;

  const basicAuthMatch = normalized.match(/(?:^|\s)-u\s+(\S+):(\S+)/);
  const basicAuth =
    basicAuthMatch && !auth
      ? { type: "basic" as AuthType, credentialRef: "basic_username" }
      : undefined;

  const queryParams: { key: string; value: string; enabled: boolean }[] = [];
  const urlWithoutProtocol = url ?? "";
  const queryIndex = urlWithoutProtocol.indexOf("?");
  if (queryIndex >= 0) {
    for (const pair of urlWithoutProtocol.slice(queryIndex + 1).split("&")) {
      const [key, value = ""] = pair.split("=");
      if (!key) continue;
      queryParams.push({ key, value, enabled: true });
    }
  }

  return {
    method,
    url: url || undefined,
    headers,
    queryParams,
    ...(body ? { body } : {}),
    ...(auth ? { auth } : {}),
    ...(basicAuth ? { auth: basicAuth } : {}),
  };
}
