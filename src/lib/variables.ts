export type VariableMap = Record<string, string>;

export interface VariableSource {
  variables?: Array<{ key: string; value: string; secret: boolean }> | null;
}

export function environmentVariablesToMap(
  environment: VariableSource | undefined | null,
): VariableMap {
  const map: VariableMap = {};
  for (const variable of environment?.variables ?? []) {
    if (!variable.key) continue;
    map[variable.key] = variable.value;
  }
  return map;
}

/**
 * Resolves a raw template (URL, header value, body, ...) against a scoped set of
 * variables and optional path parameters.
 *
 * Supported syntax:
 * - `{{variable.key}}` style environment variable references, e.g. `{{baseUrl}}/payments`
 * - `:paramName` path parameter placeholders, e.g. `/payments/:id`
 */
export function resolveVariables(
  input: string,
  variables: VariableMap,
  pathParams: Record<string, string> = {},
): string {
  const lookup: VariableMap = { ...variables, ...pathParams };

  const resolved = input.replace(
    /(^|[^a-zA-Z0-9]):([A-Za-z0-9_]+)/g,
    (match, prefix: string, param: string) => {
      const value = lookup[param] ?? lookup[param.toLowerCase()];
      if (!value) return match;
      return `${prefix}${value}`;
    },
  );

  let output = resolved;
  for (const [key, value] of Object.entries(variables)) {
    if (value === undefined || value === null || value === "") continue;
    output = output.split(`{{${key}}}`).join(value);
  }

  return output;
}
