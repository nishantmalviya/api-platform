import { environmentVariablesToMap, resolveVariables } from "@/lib/variables";
import type { ApiRequest } from "@/contracts/api";
import type { Environment } from "@/types/workspace";

function safeParseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "api-collection";
}

export function buildPostmanCollection(
  requests: ApiRequest[],
  environment: Environment,
  collectionName: string,
) {
  const items = requests.map((request) => {
    const variables = environmentVariablesToMap(environment);
    const raw = resolveVariables(request.url, variables);
    const item: Record<string, unknown> = {
      name: request.name,
      request: {
        method: request.method,
        header: (request.headers ?? [])
          .filter((header) => header.enabled)
          .map((header) => ({
            key: header.key,
            value: resolveVariables(header.value, variables),
            type: "text",
          })),
        url: { raw },
      },
    };

    if (request.body && request.body.type !== "none" && request.body.content) {
      item.request = {
        ...(item.request as Record<string, unknown>),
        body: {
          mode: request.body.type,
          ...(request.body.type === "json"
            ? { json: safeParseJson(request.body.content) }
            : { text: request.body.content }),
        },
      };
    }

    if (request.auth && request.auth.type && request.auth.type !== "none") {
      const auth: Record<string, unknown> = { type: request.auth.type };
      if (request.auth.type === "bearer") {
        auth.bearer = [
          {
            key: "token",
            value: environmentVariablesToMap(environment)[request.auth.credentialRef ?? "bearer_token"] ?? "",
            type: "string",
          },
        ];
      }
      item.request = { ...(item.request as Record<string, unknown>), auth };
    }

    return item;
  });

  return {
    info: {
      name: collectionName,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: items,
  };
}

export function buildInsomniaExport(
  requests: ApiRequest[],
  environment: Environment,
) {
  const environments = [
    {
      _id: environment.id,
      name: environment.name,
      values: environment.variables.map((variable) => ({
        key: variable.key,
        value: variable.value,
        type: variable.secret ? "string" : "string",
      })),
    },
  ];

  const apiRequests = requests.map((request) => {
    const variables = environmentVariablesToMap(environment);
    const resolvedUrl = resolveVariables(request.url, variables);
    const exported: Record<string, unknown> = {
      _id: request.id,
      name: request.name,
      method: request.method,
      parameters: (request.headers ?? [])
        .filter((header) => header.enabled)
        .map((header) => ({
          name: header.key,
          value: resolveVariables(header.value, variables),
          disabled: false,
        })),
      url: resolvedUrl,
    };
    if (request.body && request.body.type !== "none" && request.body.content) {
      exported.body = {
        type: request.body.type === "json" ? "json" : "text",
        raw: request.body.content,
      };
    }
    return exported;
  });

  return {
    _insomnia: { version: "4", time: Date.now() },
    environments,
    requests: apiRequests,
    resources: [],
  };
}

export function downloadTextFile(filename: string, content: string, mimeType = "application/json"): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportRequestsAsPostman(
  requests: ApiRequest[],
  environment: Environment,
  collectionName: string,
): void {
  const collection = buildPostmanCollection(requests, environment, collectionName);
  downloadTextFile(
    `${slugify(collectionName)}-${Date.now()}.postman.json`,
    JSON.stringify(collection, null, 2),
  );
}

export function exportRequestsAsInsomnia(
  requests: ApiRequest[],
  environment: Environment,
  collectionName: string,
): void {
  const exported = buildInsomniaExport(requests, environment);
  downloadTextFile(
    `${slugify(collectionName)}-${Date.now()}.insomnia.json`,
    JSON.stringify(exported, null, 2),
  );
}

/** Builds a local Markdown API documentation payload from a set of requests. */
export function buildMarkdownDocumentation(requests: ApiRequest[]): string {
  const lines: string[] = ["# API Documentation", ""];
  if (requests.length === 0) {
    return lines.join("\n");
  }
  for (const request of requests) {
    lines.push(`## ${request.name}`, "");
    lines.push(`- Method: \`${request.method}\``);
    lines.push(`- Endpoint: \`${request.url}\``);
    if (request.auth && request.auth.type && request.auth.type !== "none") {
      lines.push(`- Auth: ${request.auth.type}`);
    }
    if (request.body && request.body.type !== "none" && request.body.content) {
      lines.push("Body:", "", "```json", request.body.content, "```");
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function exportRequestsAsMarkdown(
  requests: ApiRequest[],
  collectionName: string,
): void {
  downloadTextFile(
    `${slugify(collectionName)}-docs-${Date.now()}.md`,
    buildMarkdownDocumentation(requests),
    "text/markdown",
  );
}
