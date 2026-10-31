import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

function JsonPrimitive({ value }: { value: unknown }) {
  if (value === null) {
    return <span className="text-red-600 dark:text-red-400">null</span>;
  }
  if (typeof value === "string") {
    return <span className="text-emerald-600 dark:text-emerald-400">"{value}"</span>;
  }
  if (typeof value === "number") {
    return <span className="text-orange-600 dark:text-orange-400">{String(value)}</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-purple-600 dark:text-purple-400">{String(value)}</span>;
  }
  return <span className="text-foreground">{String(value)}</span>;
}

interface JsonNodeProps {
  name: string;
  value: unknown;
  depth: number;
  defaultOpen?: boolean;
  comma?: string;
}

function JsonNode({ name, value, depth, defaultOpen = true, comma = "" }: JsonNodeProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isContainer = value !== null && typeof value === "object";
  const isArray = Array.isArray(value);
  const entries: Array<[string, unknown]> = isContainer
    ? isArray
      ? (value as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
      : Object.entries(value as Record<string, unknown>)
    : [];

  if (!isContainer) {
    return (
      <div className="font-mono text-xs" style={{ paddingLeft: depth * 12 }}>
        <span className="font-medium text-blue-600 dark:text-blue-400">{name}: </span>
        <JsonPrimitive value={value} />
        {comma}
      </div>
    );
  }

  if (depth === 0) {
    return (
      <div>
        {entries.map(([key, childValue], index) => (
          <JsonNode
            key={key}
            name={key}
            value={childValue}
            depth={depth + 1}
            defaultOpen={defaultOpen}
            comma={index < entries.length - 1 ? "," : ""}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center font-mono text-xs" style={{ paddingLeft: depth * 12 }}>
        <button
          type="button"
          className="mr-1 rounded p-0.5 hover:bg-accent"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Collapse element" : "Expand element"}
        >
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        <span className="font-medium text-blue-600 dark:text-blue-400">{name}</span>
        <span className="ml-1 text-muted-foreground">:</span>
        <span className="ml-1 font-medium text-muted-foreground">
          {isArray ? `[${(value as unknown[]).length}]` : `{${entries.length}}`}
        </span>
      </div>
      {open
        ? entries.map(([key, childValue], index) => (
            <JsonNode
              key={key}
              name={key}
              value={childValue}
              depth={depth + 1}
              defaultOpen={defaultOpen}
              comma={index < entries.length - 1 ? "," : ""}
            />
          ))
        : null}
    </div>
  );
}

export function JsonResponseView({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return null;
  }
  const content = <JsonNode name="" value={value} depth={0} defaultOpen />;
  return (
    <div className="overflow-auto rounded-md border border-border bg-muted p-3 font-mono text-xs" data-testid="response-json-view">
      {content}
    </div>
  );
}
