export type DiffType = "added" | "removed" | "changed" | "same";

export interface DiffEntry {
  type: DiffType;
  path?: string;
  line?: string;
  primaryValue?: unknown;
  secondaryValue?: unknown;
}

export interface DiffSummary {
  added: number;
  removed: number;
  changed: number;
  same: number;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "object") {
    return JSON.stringify(value) ?? "null";
  }
  return String(value);
}

/** Computes a deterministic semantic JSON diff between two values. */
export function diffJsonSemantic(
  primary: unknown,
  secondary: unknown,
  path = "$",
): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const walk = (a: unknown, b: unknown, currentPath: string) => {
    const aJson = canonicalize(a);
    const bJson = canonicalize(b);
    if (aJson === bJson) {
      entries.push({ type: "same", path: currentPath, primaryValue: a, secondaryValue: b });
      return;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      const length = Math.max(a.length, b.length);
      for (let index = 0; index < length; index += 1) {
        const childPath = `${currentPath}/${index}`;
        const aValue = index < a.length ? a[index] : undefined;
        const bValue = index < b.length ? b[index] : undefined;
        if (index >= a.length) {
          entries.push({ type: "added", path: childPath, secondaryValue: bValue });
        } else if (index >= b.length) {
          entries.push({ type: "removed", path: childPath, primaryValue: aValue });
        } else {
          walk(aValue, bValue, childPath);
        }
      }
      return;
    }
    if (isPlainObject(a) && isPlainObject(b)) {
      const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
      for (const key of keys) {
        const childPath = `${currentPath}/${key}`;
        const aValue = a[key];
        const bValue = b[key];
        if (aValue === undefined) {
          entries.push({ type: "added", path: childPath, secondaryValue: bValue });
        } else if (bValue === undefined) {
          entries.push({ type: "removed", path: childPath, primaryValue: aValue });
        } else {
          walk(aValue, bValue, childPath);
        }
      }
      return;
    }
    entries.push({ type: "changed", path: currentPath, primaryValue: a, secondaryValue: b });
  };
  walk(primary, secondary, path);
  return entries;
}

/** Computes a line-based text diff between two bodies. */
export function diffTextLines(primary: string, secondary: string): DiffEntry[] {
  const a = primary.split("\n");
  const b = secondary.split("\n");
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const result: DiffEntry[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      result.push({ type: "same", line: a[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: "removed", line: a[i] });
      i += 1;
    } else {
      result.push({ type: "added", line: b[j] });
      j += 1;
    }
  }
  while (i < m) {
    result.push({ type: "removed", line: a[i] });
    i += 1;
  }
  while (j < n) {
    result.push({ type: "added", line: b[j] });
    j += 1;
  }
  return result;
}

export function summarizeDiff(entries: readonly DiffEntry[]): DiffSummary {
  const summary: DiffSummary = { added: 0, removed: 0, changed: 0, same: 0 };
  for (const entry of entries) {
    if (entry.type === "added") summary.added += 1;
    else if (entry.type === "removed") summary.removed += 1;
    else if (entry.type === "changed") summary.changed += 1;
    else summary.same += 1;
  }
  return summary;
}
