import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { loader } from "@monaco-editor/react";
import { Download, Loader2, Plus, Send, Star, Terminal, Trash2, Upload } from "lucide-react";
import * as monaco from "monaco-editor";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { METHOD_TEXT_COLORS } from "@/components/method-badge";
import { Badge } from "@/components/ui/badge";
import type {
  ApiRequest,
  ApiResponse,
  AuthType,
  HttpMethod,
  RequestBodyType,
} from "@/contracts/api";
import type { Body as RequestBody } from "@/features/requests/api/httpClient";
import { DEFAULT_REQUEST_OPTIONS, executeApiRequest } from "@/features/requests/api/httpClient";
import { exportRequestsAsPostman } from "@/features/requests/api/export";
import { generateCurlCommand, parseCurlCommand } from "@/features/requests/api/curl";
import { WorkflowBuilder } from "@/features/workflows/components/WorkflowBuilder";
import {
  runResponseAssertions,
  type AssertionResult,
  type AssertionType,
  type ResponseAssertion,
} from "@/features/requests/lib/assertions";
import { cn } from "@/lib/utils";

loader.config({ monaco });

type SubTab = "params" | "headers" | "auth" | "body" | "tests";
const HTTP_METHODS: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

const BODY_TYPES: RequestBodyType[] = [
  "none",
  "json",
  "xml",
  "text",
  "form",
  "multipart",
  "binary",
];

const AUTH_TYPES: AuthType[] = [
  "none",
  "basic",
  "bearer",
  "apiKey",
  "oauth2",
  "mtls",
];

interface KeyValue {
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestEditorProps {
  requestId: string;
}

export function RequestEditor({ requestId }: RequestEditorProps) {
  const request = useWorkspaceStore((state) =>
    state.requests.find((item) => item.id === requestId),
  );
  const updateRequest = useWorkspaceStore((state) => state.updateRequest);
  const sendRequest = useWorkspaceStore((state) => state.sendRequest);
  const recordResponse = useWorkspaceStore((state) => state.recordResponse);
  const sendingRequestIds = useWorkspaceStore(
    (state) => state.sendingRequestIds,
  );
  const responses = useWorkspaceStore((state) => state.responses);
  const environments = useWorkspaceStore((state) => state.environments);
  const activeEnvironmentId = useWorkspaceStore(
    (state) => state.activeEnvironmentId,
  );
  const createRequest = useWorkspaceStore((state) => state.createRequest);
  const openRequest = useWorkspaceStore((state) => state.openRequest);
  const favoriteRequestIds = useWorkspaceStore((state) => state.favoriteRequestIds);
  const toggleFavoriteRequest = useWorkspaceStore(
    (state) => state.toggleFavoriteRequest,
  );
  const [subTab, setSubTab] = useState<SubTab>("params");
  const isFavorite = Boolean(request && favoriteRequestIds.includes(request.id));
  const [isCurlImportOpen, setIsCurlImportOpen] = useState(false);
  const [curlImportText, setCurlImportText] = useState("");
  const [curlError, setCurlError] = useState<string | null>(null);
  const [assertions, setAssertions] = useState<ResponseAssertion[]>([
    { id: "assert_status_default", type: "status", expectedStatus: 200 },
  ]);
  const [assertionResults, setAssertionResults] = useState<AssertionResult[] | null>(
    null,
  );
  const [newAssertionType, setNewAssertionType] = useState<AssertionType>("status");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "enter"
      ) {
        event.preventDefault();
        void sendRequest();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sendRequest]);

  if (!request) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Request not found.
      </div>
    );
  }

  const isSending = sendingRequestIds.includes(request.id);
  const authType = request.auth?.type;
  const body: RequestBody | undefined = request.body;

  const update = (patch: Partial<ApiRequest>) =>
    updateRequest(request.id, patch);

  const updateQueryParams = (queryParams: KeyValue[]) =>
    update({ queryParams });

  const updateHeaders = (headers: KeyValue[]) => update({ headers });

  const setAuthType = (type: AuthType) =>
    update({
      auth: { type, credentialRef: type === "none" ? undefined : request.auth?.credentialRef },
    });

  const setCredentialRef = (credentialRef: string) =>
    update({
      auth: {
        type: authType ?? "none",
        credentialRef: credentialRef || undefined,
      },
    });

  const setBodyType = (type: RequestBodyType) => {
    const content =
      type === "none"
        ? undefined
        : type === "json"
          ? JSON.stringify(
              { amount: 100, currency: "USD", recipient: "test-user" },
              null,
              2,
            )
          : "";
    update({ body: { type, content } });
  };

  const editorLanguage =
    body?.type === "json" ? "json" : body?.type === "xml" ? "xml" : "text";

  const handleExportRequest = async () => {
    const environment = environments.find((item) => item.id === activeEnvironmentId) ?? environments[0];
    if (!environment) return;
    if (!request) return;
    try {
      const { response } = await executeApiRequest(request, environment);
      recordResponse(request.id, response);
    } catch {
      const errorResponse: ApiResponse = {
        requestId: request.id,
        status: 0,
        statusText: "Network error",
        headers: {},
        durationMs: 0,
        truncated: false,
        sizeBytes: 0,
      };
      recordResponse(request.id, errorResponse);
    }
    exportRequestsAsPostman([request], environment, request.name);
  };

  const handleCopyCurl = async () => {
    if (!request) return;
    const environment = environments.find((item) => item.id === activeEnvironmentId) ?? environments[0];
    if (!environment) return;
    const command = generateCurlCommand(request, environment);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(command);
        return;
      }
      throw new Error("Clipboard API unavailable");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = command;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  const handleImportCurl = () => {
    const parsed = parseCurlCommand(curlImportText);
    const input: Omit<ApiRequest, "id"> = {
      name: `cURL ${parsed.method} ${parsed.url ?? ""}`.trim(),
      method: parsed.method as HttpMethod,
      url: parsed.url ?? "",
      headers: parsed.headers.map((header) => ({
        key: header.key,
        value: header.value,
        enabled: true,
      })),
      queryParams: parsed.queryParams,
      ...(parsed.body ? { body: parsed.body } : {}),
      ...(parsed.auth ? { auth: parsed.auth } : {}),
      environmentId:
        environments.find((item) => item.id === activeEnvironmentId)?.id ??
        environments[0]?.id,
      options: { ...DEFAULT_REQUEST_OPTIONS },
    };
    const folderId = useWorkspaceStore
      .getState()
      .workspaces.flatMap((workspace) => workspace.collections)
      .flatMap((collection) => collection.folders ?? [])
      .map((folder) => folder.id)[0] ?? "";
    const requestId = createRequest(input, folderId);
    openRequest(requestId);
    setIsCurlImportOpen(false);
    setCurlImportText("");
    setCurlError(null);
  };

  const handleAddAssertion = () => {
    const nextId = `assert_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    setAssertions((prev) => [...prev, { id: nextId, type: newAssertionType }]);
  };

  const updateAssertion = (id: string, patch: Partial<ResponseAssertion>) => {
    setAssertions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const removeAssertion = (id: string) => {
    setAssertions((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRunAssertions = () => {
    const response = responses[request.id];
    const results = runResponseAssertions(request, response, assertions);
    setAssertionResults(results);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border p-3">
        <Select
          value={request.method}
          onChange={(event) =>
            update({ method: event.target.value as HttpMethod })
          }
          className="w-[160px] font-bold"
          data-testid="method-select"
          style={{ color: METHOD_TEXT_COLORS[request.method], width: "160px" }}
        >
          {HTTP_METHODS.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </Select>
        <Input
          value={request.url}
          onChange={(event) => update({ url: event.target.value })}
          placeholder="https://api.example.com/payments"
          className="h-9 font-mono"
          data-testid="url-input"
        />
        <Button
          variant="secondary"
          onClick={() => void sendRequest()}
          disabled={isSending}
          data-testid="send-button"
          title="Send request"
          className="h-9 rounded!"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isSending ? "Sending…" : "Send"}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => void handleExportRequest()}
          aria-label="Export request"
          data-testid="export-request-button"
          title="Export request"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopyCurl}
          aria-label="Export cURL command"
          data-testid="export-curl-button"
          title="Export cURL command"
        >
          <Terminal className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCurlImportOpen(true)}
          data-testid="open-curl-import-button"
          title="Import cURL"
        >
          <Upload className="h-4 w-4" />
          Import cURL
        </Button>
        <Button
          variant={isFavorite ? "outline" : "ghost"}
          size="icon"
          onClick={() => {
            if (!request) return;
            toggleFavoriteRequest(request.id);
          }}
          aria-label={isFavorite ? "Unfavorite request" : "Favorite request"}
          aria-pressed={isFavorite}
          data-testid="favorite-request-button"
          title={isFavorite ? "Unfavorite request" : "Favorite request"}
          className={cn(isFavorite && "text-amber-400")}
        >
          <Star className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
        </Button>
      </div>

      {isCurlImportOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          data-testid="curl-import-dialog"
        >
          <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-4 shadow-lg">
            <h3 className="text-sm font-semibold">Import from cURL</h3>
            <Textarea
              value={curlImportText}
              onChange={(event) => setCurlImportText(event.target.value)}
              placeholder={"curl -X POST https://api.example.com/payments ..."}
              className="mt-2 min-h-32 font-mono text-xs"
              data-testid="curl-import-input"
            />
            {curlError ? (
              <p className="mt-1 text-xs text-destructive" data-testid="curl-import-error">
                {curlError}
              </p>
            ) : null}
            <div className="mt-3 flex items-center gap-2">
              <Button
                onClick={handleImportCurl}
                disabled={!curlImportText.trim()}
                data-testid="import-curl-button"
              >
                Import
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCurlImportOpen(false);
                  setCurlImportText("");
                  setCurlError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="border-b border-border px-3">
        <Tabs
          value={subTab}
          onValueChange={(value) => setSubTab(value as SubTab)}
        >
          <div className="flex h-10 items-center">
            <TabsList>
              <TabsTrigger value="params">Params</TabsTrigger>
              <TabsTrigger value="headers">Headers</TabsTrigger>
              <TabsTrigger value="auth">Auth</TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="tests">Tests</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        <Tabs
          value={subTab}
          onValueChange={(value) => setSubTab(value as SubTab)}
        >
          <TabsContent value="params">
            <KeyValueEditor
              rows={request.queryParams ?? []}
              onChange={updateQueryParams}
              keyPlaceholder="Parameter"
              valuePlaceholder="Value"
            />
          </TabsContent>
          <TabsContent value="headers">
            <KeyValueEditor
              rows={request.headers ?? []}
              onChange={updateHeaders}
              keyPlaceholder="Header"
              valuePlaceholder="Value"
            />
          </TabsContent>
          <TabsContent value="auth">
            <div className="space-y-3">
              <Select
                value={authType ?? "none"}
                onChange={(event) =>
                  setAuthType(event.target.value as AuthType)
                }
                data-testid="auth-type-select"
              >
                {AUTH_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
              {(authType === "bearer" || authType === "apiKey") && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Credential reference (environment variable)
                  </label>
                  <Input
                    value={request.auth?.credentialRef ?? ""}
                    onChange={(event) => setCredentialRef(event.target.value)}
                    placeholder="e.g. bearer_token"
                    data-testid="credential-ref-input"
                  />
                  {authType === "apiKey" ? (
                    <p className="text-xs text-muted-foreground">
                      The API key header defaults to{" "}
                      <code className="font-mono">X-API-Key</code> and can be
                      overridden with the <code className="font-mono">apiKeyHeader</code>{" "}
                      environment variable.
                    </p>
                  ) : null}
                </div>
              )}
              {authType === "basic" ? (
                <p className="text-xs text-muted-foreground">
                  Basic auth credentials are resolved from the{" "}
                  <code className="font-mono">basic_username</code> and{" "}
                  <code className="font-mono">basic_password</code> environment
                  variables of the selected environment.
                </p>
              ) : null}
            </div>
          </TabsContent>
          <TabsContent value="body">
            <div className="space-y-3">
              <Select
                value={body?.type ?? "none"}
                onChange={(event) =>
                  setBodyType(event.target.value as RequestBodyType)
                }
              >
                {BODY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
              {body && body.type !== "none" ? (
                <Editor
                  height={280}
                  language={editorLanguage}
                  value={body.content ?? ""}
                  onChange={(value) =>
                    update({ body: { type: body.type, content: value ?? "" } })
                  }
                  options={{ minimap: { enabled: false }, fontSize: 12 }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No body will be sent for this request.
                </p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="tests">
            <div className="flex h-full flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Visual assertions run against the captured response.
                </p>
                <div className="flex items-center gap-2">
                  <Select
                    value={newAssertionType}
                    onChange={(event) =>
                      setNewAssertionType(event.target.value as AssertionType)
                    }
                    className="h-8 w-44"
                    data-testid="new-assertion-type"
                  >
                    <option value="status">Status</option>
                    <option value="header">Header</option>
                    <option value="responseTime">Response time</option>
                    <option value="jsonPath">JSON path</option>
                    <option value="bodyValue">Body value</option>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddAssertion}
                    data-testid="add-assertion-button"
                  >
                    Add assertion
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRunAssertions}
                    data-testid="run-assertions-button"
                  >
                    Run
                  </Button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                <div className="space-y-2">
                  {assertions.map((assertion) => (
                    <div
                      key={assertion.id}
                      className="flex items-center gap-2 rounded-md border border-border p-2"
                      data-testid={`assertion-editor-${assertion.id}`}
                    >
                      <Select
                        value={assertion.type}
                        onChange={(event) =>
                          updateAssertion(assertion.id, {
                            type: event.target.value as AssertionType,
                          })
                        }
                        className="h-8 w-40"
                        data-testid={`assertion-type-${assertion.id}`}
                      >
                        <option value="status">Status</option>
                        <option value="header">Header</option>
                        <option value="responseTime">Response time</option>
                        <option value="jsonPath">JSON path</option>
                        <option value="bodyValue">Body value</option>
                      </Select>
                      {assertion.type === "status" ? (
                        <Input
                          type="number"
                          value={assertion.expectedStatus ?? 0}
                          onChange={(event) =>
                            updateAssertion(assertion.id, {
                              expectedStatus: Number(event.target.value),
                            })
                          }
                          className="h-8 w-24"
                          data-testid={`assertion-expected-status-${assertion.id}`}
                        />
                      ) : null}
                      {assertion.type === "header" ? (
                        <>
                          <Input
                            value={assertion.headerKey ?? ""}
                            onChange={(event) =>
                              updateAssertion(assertion.id, { headerKey: event.target.value })
                            }
                            className="h-8 w-40"
                            placeholder="Header"
                            data-testid={`assertion-header-key-${assertion.id}`}
                          />
                          <Input
                            value={assertion.headerExpected ?? ""}
                            onChange={(event) =>
                              updateAssertion(assertion.id, { headerExpected: event.target.value })
                            }
                            className="h-8 w-56"
                            placeholder="Expected value"
                            data-testid={`assertion-header-expected-${assertion.id}`}
                          />
                        </>
                      ) : null}
                      {assertion.type === "responseTime" ? (
                        <Input
                          type="number"
                          value={assertion.maxDurationMs ?? 0}
                          onChange={(event) =>
                            updateAssertion(assertion.id, { maxDurationMs: Number(event.target.value) })
                          }
                          className="h-8 w-28"
                          data-testid={`assertion-max-duration-${assertion.id}`}
                        />
                      ) : null}
                      {(assertion.type === "jsonPath" || assertion.type === "bodyValue") ? (
                        <>
                          <Input
                            value={assertion.jsonPath ?? "$"}
                            onChange={(event) =>
                              updateAssertion(assertion.id, { jsonPath: event.target.value })
                            }
                            className="h-8 w-48 font-mono text-xs"
                            data-testid={`assertion-json-path-${assertion.id}`}
                          />
                          {assertion.type === "bodyValue" ? (
                            <Input
                              value={JSON.stringify(assertion.expectedValue ?? null)}
                              onChange={(event) => {
                                try {
                                  updateAssertion(assertion.id, {
                                    expectedValue: JSON.parse(event.target.value),
                                  });
                                } catch {
                                  // Ignore partial JSON edits while typing.
                                }
                              }}
                              className="h-8 w-56 font-mono text-xs"
                              data-testid={`assertion-expected-value-${assertion.id}`}
                            />
                          ) : null}
                        </>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAssertion(assertion.id)}
                        aria-label="Remove assertion"
                        data-testid={`remove-assertion-${assertion.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              {assertionResults ? (
                <div
                  className="max-h-56 overflow-auto rounded-md border border-border p-3"
                  data-testid="assertion-results"
                >
                  {assertionResults.map((result) => (
                    <div
                      key={result.assertion.id}
                      className="flex items-center gap-2 py-1 text-sm"
                      data-testid={`assertion-result-${result.assertion.id}`}
                    >
                      <Badge variant={result.passed ? "success" : "error"}>
                        {result.passed ? "PASS" : "FAIL"}
                      </Badge>
                      <span>{result.message}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              <WorkflowBuilder />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface KeyValueEditorProps {
  rows: KeyValue[] | undefined;
  onChange: (rows: KeyValue[]) => void;
  keyPlaceholder: string;
  valuePlaceholder: string;
}

function KeyValueEditor({
  rows,
  onChange,
  keyPlaceholder,
  valuePlaceholder,
}: KeyValueEditorProps) {
  const safeRows = rows ?? [];

  const updateRow = (index: number, patch: Partial<KeyValue>) => {
    onChange(
      safeRows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const removeRow = (index: number) => {
    onChange(safeRows.filter((_, i) => i !== index));
  };

  const addRow = () =>
    onChange([...safeRows, { key: "", value: "", enabled: true }]);

  return (
    <div className="space-y-2">
      {safeRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No entries defined.
        </p>
      ) : (
        safeRows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              type="checkbox"
              checked={row.enabled}
              onChange={(event) =>
                updateRow(index, { enabled: event.target.checked })
              }
              aria-label="Enable row"
              className="h-9 w-9"
            />
            <Input
              value={row.key}
              onChange={(event) =>
                updateRow(index, { key: event.target.value })
              }
              placeholder={keyPlaceholder}
              className="h-8 font-mono text-xs"
            />
            <Input
              value={row.value}
              onChange={(event) =>
                updateRow(index, { value: event.target.value })
              }
              placeholder={valuePlaceholder}
              className="h-8 font-mono text-xs"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeRow(index)}
              aria-label="Remove row"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))
      )}
      <Button variant="outline" size="sm" onClick={addRow}>
        <Plus className="h-3.5 w-3.5" />
        Add entry
      </Button>
    </div>
  );
}
