import { useMemo, useState } from "react";
import { BookOpen, Trash2, Upload } from "lucide-react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MethodBadge } from "@/components/method-badge";
import {
  extractOpenApiOperations,
  generateApiRequestFromOperation,
  parseOpenApiDocument,
} from "@/features/openapi/lib/openApi";
import type { OpenApiOperation } from "@/features/openapi/lib/openApi";

interface OpenApiExplorerProps {
  onGenerated: (requestId: string) => void;
}

export function OpenApiExplorer({ onGenerated }: OpenApiExplorerProps) {
  const openApiDocument = useWorkspaceStore((state) => state.openApiDocument);
  const importOpenApiDocument = useWorkspaceStore((state) => state.importOpenApiDocument);
  const clearOpenApiDocument = useWorkspaceStore((state) => state.clearOpenApiDocument);
  const createRequest = useWorkspaceStore((state) => state.createRequest);
  const openRequest = useWorkspaceStore((state) => state.openRequest);
  const environments = useWorkspaceStore((state) => state.environments);
  const activeEnvironmentId = useWorkspaceStore((state) => state.activeEnvironmentId);

  const [docText, setDocText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const operations = useMemo(
    () => (openApiDocument ? extractOpenApiOperations(openApiDocument) : []),
    [openApiDocument],
  );

  const environment = environments.find((item) => item.id === activeEnvironmentId) ?? environments[0];

  const groups = useMemo(() => {
    const ordered: { tag: string; operations: OpenApiOperation[] }[] = [];
    const indexByTag = new Map<string, number>();
    for (const operation of operations) {
      const tag = operation.tags[0] ?? "default";
      const existing = indexByTag.get(tag);
      if (existing === undefined) {
        indexByTag.set(tag, ordered.length);
        ordered.push({ tag, operations: [operation] });
      } else {
        ordered[existing].operations.push(operation);
      }
    }
    return ordered;
  }, [operations]);

  const handleImport = () => {
    try {
      const document = parseOpenApiDocument(docText);
      importOpenApiDocument(document);
      setError(null);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Failed to parse OpenAPI document");
    }
  };

  const findTargetFolderId = (): string => {
    const { workspaces } = useWorkspaceStore.getState();
    for (const workspace of workspaces) {
      for (const collection of workspace.collections) {
        const folder = (collection.folders ?? []).find((item) => item.requestIds.length > 0);
        if (folder) return folder.id;
      }
    }
    return "";
  };

  const handleGenerate = (operation: OpenApiOperation) => {
    if (!environment) return;
    const input = generateApiRequestFromOperation(operation, environment);
    const requestId = createRequest(input, findTargetFolderId());
    openRequest(requestId);
    onGenerated(requestId);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">OpenAPI Explorer</h2>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            disabled={!docText.trim()}
            data-testid="import-openapi-button"
          >
            <Upload className="h-3.5 w-3.5" />
            Import OpenAPI
          </Button>
          {openApiDocument ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearOpenApiDocument}
              aria-label="Clear OpenAPI document"
              data-testid="clear-openapi-button"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <Textarea
        value={docText}
        onChange={(event) => setDocText(event.target.value)}
        placeholder={'Paste an OpenAPI 3.x document as JSON or YAML…'}
        className="min-h-32 font-mono text-xs"
        data-testid="openapi-document-input"
      />
      {error ? (
        <p className="text-xs text-destructive" data-testid="openapi-error">
          {error}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-card p-3">
        {openApiDocument ? (
          operations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No HTTP operations found in this document.</p>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.tag}>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.tag}
                  </h3>
                  <div className="space-y-1">
                    {group.operations.map((operation) => (
                      <button
                        key={`${operation.method}-${operation.path}`}
                        type="button"
                        onClick={() => handleGenerate(operation)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
                        data-testid={`openapi-operation-${operation.method}-${operation.path.replace(/\//g, "-")}`}
                      >
                        <MethodBadge method={operation.method} />
                        <span className="min-w-0 flex-1 truncate font-mono text-xs">
                          {`${operation.method} ${operation.operationId ?? operation.summary ?? operation.path}`}
                        </span>
                        {operation.summary && !operation.operationId ? (
                          <span className="truncate text-xs text-muted-foreground">
                            {operation.summary}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <BookOpen className="mr-2 h-4 w-4" />
            Import an OpenAPI 3.x document to browse operations and generate requests.
          </div>
        )}
      </div>
    </div>
  );
}
