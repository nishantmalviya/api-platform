import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const INDENT = "  ";

function JsonPrimitive({ value }: { value: unknown }) {
  const text = JSON.stringify(value) ?? String(value);
  if (value === null) {
    return <span className="text-red-600 dark:text-red-400">{text}</span>;
  }
  if (typeof value === "string") {
    return <span className="text-emerald-600 dark:text-emerald-400">{text}</span>;
  }
  if (typeof value === "number") {
    return <span className="text-orange-600 dark:text-orange-400">{text}</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-purple-600 dark:text-purple-400">{text}</span>;
  }
  return <span className="text-foreground">{text}</span>;
}

function JsonKey({ name }: { name: string }) {
  return (
    <>
      <span className="font-medium text-blue-600 dark:text-blue-400">{JSON.stringify(name)}</span>
      <span className="text-muted-foreground">: </span>
    </>
  );
}

interface JsonNodeProps {
  /** Property name; undefined for array items and the root value. */
  name?: string;
  value: unknown;
  depth: number;
  isLast: boolean;
}

// Each line keeps real indentation and punctuation as text so selecting and
// copying the rendered view yields valid, formatted JSON.
function JsonNode({ name, value, depth, isLast }: JsonNodeProps) {
  const [open, setOpen] = useState(true);
  const indent = INDENT.repeat(depth);
  const comma = isLast ? "" : ",";
  const prefix = (
    <>
      {indent}
      {name !== undefined ? <JsonKey name={name} /> : null}
    </>
  );

  if (value === null || typeof value !== "object") {
    return (
      <div className="relative whitespace-pre-wrap break-all pl-5">
        {prefix}
        <JsonPrimitive value={value} />
        {comma}
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const openChar = isArray ? "[" : "{";
  const closeChar = isArray ? "]" : "}";
  const entries: Array<[string | undefined, unknown]> = isArray
    ? (value as unknown[]).map((item) => [undefined, item])
    : Object.entries(value as Record<string, unknown>);

  if (entries.length === 0) {
    return (
      <div className="relative whitespace-pre pl-5">
        {prefix}
        {openChar}
        {closeChar}
        {comma}
      </div>
    );
  }

  return (
    <div>
      <div className="relative whitespace-pre pl-5">
        <button
          type="button"
          className="absolute left-0 top-0 select-none rounded p-0.5 hover:bg-accent"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Collapse element" : "Expand element"}
        >
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
        {prefix}
        {openChar}
        {open ? null : (
          <>
            <span className="text-muted-foreground">
              {" "}
              {entries.length} {entries.length === 1 ? "item" : "items"}{" "}
            </span>
            {closeChar}
            {comma}
          </>
        )}
      </div>
      {open ? (
        <>
          {entries.map(([key, childValue], index) => (
            <JsonNode
              key={key !== undefined ? `${key}-${index}` : index}
              name={key}
              value={childValue}
              depth={depth + 1}
              isLast={index === entries.length - 1}
            />
          ))}
          <div className="whitespace-pre pl-5">
            {indent}
            {closeChar}
            {comma}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function JsonResponseView({ value }: { value: unknown }) {
  if (value === undefined) {
    return null;
  }
  return (
    <div
      className="overflow-auto rounded-md border border-border bg-muted p-3 font-mono text-xs"
      data-testid="response-json-view"
    >
      <JsonNode value={value} depth={0} isLast />
    </div>
  );
}
