import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { diffJsonSemantic, diffTextLines, summarizeDiff } from "@/features/requests/lib/diff";
import { JsonResponseView } from "@/features/requests/components/JsonResponseView";
import type { DiffEntry } from "@/features/requests/lib/diff";

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export interface ResponseViewerProps {
  requestId: string;
}

export function ResponseViewer({ requestId }: ResponseViewerProps) {
  const responses = useWorkspaceStore((state) => state.responses);
  const requests = useWorkspaceStore((state) => state.requests);
  const sendingRequestIds = useWorkspaceStore(
    (state) => state.sendingRequestIds,
  );
  const response = responses[requestId];
  const isSending = sendingRequestIds.includes(requestId);
  const [bodyTab, setBodyTab] = useState<"body" | "headers">("body");
  const [compareRequestId, setCompareRequestId] = useState<string>("");
  const compareResponse = compareRequestId ? responses[compareRequestId] : undefined;

  const comparableRequestIds = useMemo(() => {
    const ids: string[] = [];
    for (const item of requests) {
      if (item.id === requestId) continue;
      if (responses[item.id]) ids.push(item.id);
    }
    return ids;
  }, [requests, responses, requestId]);

  const diffEntries = useMemo<DiffEntry[]>(() => {
    if (!response || !compareResponse) return [];
    const primaryText = response.bodyPreview ?? "";
    const secondaryText = compareResponse.bodyPreview ?? "";
    const primaryParsed = safeJsonParse(primaryText);
    const secondaryParsed = safeJsonParse(secondaryText);
    if (primaryParsed !== undefined && secondaryParsed !== undefined) {
      return diffJsonSemantic(primaryParsed, secondaryParsed);
    }
    return diffTextLines(primaryText, secondaryText);
  }, [response, compareResponse]);

  const diffSummary = useMemo(() => summarizeDiff(diffEntries), [diffEntries]);

  const prettyBody = useMemo(() => {
    if (!response?.bodyPreview) return "";
    try {
      return JSON.stringify(JSON.parse(response.bodyPreview), null, 2);
    } catch {
      return response.bodyPreview;
    }
  }, [response]);

  const statusVariant: BadgeVariant =
    !response || response.status === 0
      ? "error"
      : response.status < 300
        ? "success"
        : response.status < 500
          ? "warning"
          : "error";

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border px-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Response
        </h3>
        {response ? (
          <>
            <Badge variant={statusVariant} data-testid="response-status">
              {response.status || "ERR"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {response.statusText}
            </span>
            <span className="text-xs text-muted-foreground">
              {response.durationMs}ms
            </span>
            <span className="text-xs text-muted-foreground">
              {response.sizeBytes} bytes
            </span>
            {response.truncated ? (
              <Badge variant="warning">Truncated</Badge>
            ) : null}
          </>
        ) : null}
        <Select
          value={compareRequestId}
          onChange={(event) => setCompareRequestId(event.target.value)}
          className="ml-auto h-7 w-64"
          data-testid="compare-response-select"
        >
          <option value="">Compare with…</option>
          {comparableRequestIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </Select>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {isSending ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Executing request…
          </div>
        ) : response ? (
          <>
            {compareResponse ? (
              <div
                className="mb-3 rounded-md border border-border p-3"
                data-testid="response-diff-panel"
              >
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Response Diff
                  </h4>
                  <Badge variant="outline" data-testid="diff-added-count">
                    +{diffSummary.added} added
                  </Badge>
                  <Badge variant="outline" data-testid="diff-removed-count">
                    -{diffSummary.removed} removed
                  </Badge>
                  <Badge variant="outline" data-testid="diff-changed-count">
                    ~{diffSummary.changed} changed
                  </Badge>
                </div>
                {diffEntries.filter((entry) => entry.type !== "same").length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Responses are identical.
                  </p>
                ) : (
                  <div
                    className="mt-2 max-h-72 overflow-auto rounded-md bg-muted p-2"
                    data-testid="response-diff-entries"
                  >
                    {diffEntries
                      .filter((entry) => entry.type !== "same")
                      .map((entry, index) => (
                        <div
                          key={`${entry.path}-${index}`}
                          className="flex items-center gap-2 py-0.5 font-mono text-xs"
                        >
                          <Badge
                            variant={
                              entry.type === "added"
                                ? "success"
                                : entry.type === "removed"
                                  ? "error"
                                  : "warning"
                            }
                          >
                            {entry.type}
                          </Badge>
                          <span className="font-medium">{entry.path}</span>
                          {entry.type === "changed" ? (
                            <span className="break-all text-muted-foreground">
                              {JSON.stringify(entry.primaryValue) ?? "—"} →{" "}
                              {JSON.stringify(entry.secondaryValue) ?? "—"}
                            </span>
                          ) : null}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : null}
            {response ? (
              <div
                className="mb-3 rounded-md border border-border p-3"
                data-testid="response-timing"
              >
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Timing
                </h4>
                <div className="mt-2 space-y-1" data-testid="response-timing-rows">
                  {(
                    [
                      { label: "DNS lookup", valueMs: null as number | null, available: false },
                      { label: "Connection", valueMs: null as number | null, available: false },
                      { label: "TLS handshake", valueMs: null as number | null, available: false },
                      { label: "First byte", valueMs: null as number | null, available: false },
                      { label: "Total", valueMs: response.durationMs, available: true },
                    ] as const
                  ).map((phase) => (
                    <div
                      key={phase.label}
                      className="flex items-center justify-between font-mono text-xs"
                    >
                      <span>{phase.label}</span>
                      <span className="text-muted-foreground">
                        {phase.available ? `${phase.valueMs}ms` : "Unavailable"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {bodyTab === "body" ? (
              safeJsonParse(prettyBody) !== undefined ? (
                <div className="overflow-auto rounded-md border border-border bg-muted p-3 font-mono text-xs">
                  <JsonResponseView value={safeJsonParse(prettyBody)} />
                </div>
              ) : (
                <pre className="overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
                  {prettyBody}
                </pre>
              )
            ) : (
              <div className="rounded-md border border-border">
                {Object.keys(response.headers).length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">
                    No response headers captured.
                  </p>
                ) : (
                  Object.entries(response.headers).map(([key, values]) => (
                    <div
                      key={key}
                      className="flex gap-3 border-b border-border py-1.5 font-mono text-xs last:border-b-0"
                    >
                      <span className="w-48 shrink-0 font-medium">{key}</span>
                      <span className="break-all">{values.join(", ")}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Send a request to inspect the response here.
          </div>
        )}
      </div>

      {response ? (
        <div className="border-t border-border px-3 py-2">
          <Tabs value={bodyTab} onValueChange={(value) => setBodyTab(value as "body" | "headers")}>
            <TabsList>
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="headers">Headers</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ) : null}
    </div>
  );
}
