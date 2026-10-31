import { Trash2 } from "lucide-react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { Button } from "@/components/ui/button";
import { MethodBadge } from "@/components/method-badge";

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

export function HistoryPanel() {
  const history = useWorkspaceStore((state) => state.history);
  const clearHistory = useWorkspaceStore((state) => state.clearHistory);
  const openRequest = useWorkspaceStore((state) => state.openRequest);
  const requests = useWorkspaceStore((state) => state.requests);

  const resolveLabel = (requestId: string): string => {
    const request = requests.find((item) => item.id === requestId);
    return request?.name ?? requestId;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">History</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearHistory}
          disabled={history.length === 0}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No requests executed yet. Send a request to build history.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {history.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => openRequest(entry.requestId)}
                  className="flex w-full items-start gap-2 px-4 py-2.5 text-left transition-colors hover:bg-accent"
                >
                  <MethodBadge method={entry.method} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs text-foreground">
                      {resolveLabel(entry.requestId)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {entry.status} · {entry.durationMs}ms ·{" "}
                      {(entry.sizeBytes / 1024).toFixed(1)}KB ·{" "}
                      {formatTimestamp(entry.timestamp)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
