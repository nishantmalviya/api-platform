import { useEffect, useState } from "react";
import { Download, FileText, FolderPlus, Minus, Pencil, Plus, Trash2, X } from "lucide-react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { Button } from "@/components/ui/button";
import { MethodBadge } from "@/components/method-badge";
import type { ApiRequest } from "@/contracts/api";
import { exportRequestsAsPostman, exportRequestsAsMarkdown } from "@/features/requests/api/export";

interface FolderRowProps {
  folderId: string;
  folderName: string;
  folderRequests: ApiRequest[];
  onCreateApi: (folderId: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onExport: (folderId: string) => void;
  onExportRequests: (requests: ApiRequest[], collectionName: string) => void;
}

function FolderRow({
  folderId,
  folderName,
  folderRequests,
  onCreateApi,
  onRenameFolder,
  onExport,
  onExportRequests,
}: FolderRowProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(folderName);
  const [isExpanded, setIsExpanded] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isExportChooserOpen, setIsExportChooserOpen] = useState(false);
  const [selectedExportIds, setSelectedExportIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isExportChooserOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExportChooserOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExportChooserOpen]);

  const commitRename = () => {
    const name = draftName.trim();
    if (name && name !== folderName) {
      onRenameFolder(folderId, name);
    }
    setIsRenaming(false);
  };

  return (
    <div>
      <div className="relative">
        <div
          className="flex items-center justify-between px-2 py-1"
          onContextMenu={(event) => {
            event.preventDefault();
            setContextMenu({ x: event.clientX, y: event.clientY });
          }}
        >
          <div className="flex min-w-0 items-center gap-1">
            {isRenaming ? (
            <input
              autoFocus
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitRename();
                if (event.key === "Escape") setIsRenaming(false);
              }}
              className="h-7 w-44 rounded-md border border-input bg-background px-2 text-xs"
              data-testid="rename-folder-input"
            />
          ) : (
            <p
              className="cursor-pointer text-xs font-medium text-muted-foreground"
              onClick={() => setIsExpanded((prev) => !prev)}
              data-testid={`collapse-folder-${folderId}`}
            >
              {folderName}{" "}
              <span className="opacity-70">({folderRequests.length})</span>
            </p>
          )}
          </div>
          {contextMenu ? (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setContextMenu(null)}
              />
              <div
                className="fixed z-50 min-w-40 rounded-md border border-border bg-popover p-2 shadow-md"
                style={{ left: contextMenu.x, top: contextMenu.y }}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    setContextMenu(null);
                    setIsExpanded((prev) => !prev);
                  }}
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  {isExpanded ? "Collapse" : "Expand"}
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    setContextMenu(null);
                    onCreateApi(folderId);
                  }}
                  title="New API"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New API
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    setContextMenu(null);
                    setIsExportChooserOpen(true);
                  }}
                  title="Export"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    setContextMenu(null);
                    setDraftName(folderName);
                    setIsRenaming(true);
                  }}
                  title="Rename"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Rename
                </button>
              </div>
            </>
          ) : null}
        </div>
        {isExportChooserOpen ? (
          <div
            className="absolute right-0 top-full z-50 mt-1 w-72 rounded-md border border-border bg-popover p-2 shadow-md"
            data-testid={`export-chooser-${folderId}`}
          >
            <div className="mb-1 flex items-center justify-between px-1">
              <span className="text-xs font-medium">Export from {folderName}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => setIsExportChooserOpen(false)}
                aria-label="Close export dialog"
                data-testid={`close-export-chooser-${folderId}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mb-1 w-full justify-start"
              onClick={() => {
                setIsExportChooserOpen(false);
                onExport(folderId);
              }}
            >
              Export All
            </Button>
            <div className="max-h-56 overflow-auto">
              {folderRequests.map((request) => {
                const checked = selectedExportIds.includes(request.id);
                return (
                  <label
                    key={request.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs hover:bg-accent"
                    data-testid={`export-option-${request.id}`}
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5"
                      checked={checked}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedExportIds((prev) =>
                            prev.includes(request.id) ? prev : [...prev, request.id],
                          );
                        } else {
                          setSelectedExportIds((prev) =>
                            prev.filter((id) => id !== request.id),
                          );
                        }
                      }}
                    />
                    <MethodBadge method={request.method} />
                    <span className="min-w-0 flex-1 truncate">{request.name}</span>
                  </label>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-1 w-full justify-start"
              disabled={selectedExportIds.length === 0}
              onClick={() => {
                setIsExportChooserOpen(false);
                const selected = folderRequests.filter((item) =>
                  selectedExportIds.includes(item.id),
                );
                onExportRequests(selected, folderName);
              }}
            >
              Export Selected ({selectedExportIds.length})
            </Button>
          </div>
        ) : null}
      </div>
      {isExpanded ? (
      <div className="space-y-0.5 pl-2">
        {folderRequests.map((request) => {
          return (
            <ApiRow
              key={request.id}
              request={request}
              onOpen={(id) => useWorkspaceStore.getState().openRequest(id)}
              displayText={request.name}
            />
          );
        })}
      </div>
      ) : null}
    </div>
  );
}

interface ApiRowProps {
  request: ApiRequest;
  onOpen: (requestId: string) => void;
  displayText?: string;
}

function ApiRow({ request, onOpen, displayText }: ApiRowProps) {
  const updateRequest = useWorkspaceStore((state) => state.updateRequest);
  const deleteRequest = useWorkspaceStore((state) => state.deleteRequest);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(request.name);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const commitRename = () => {
    const name = draftName.trim();
    if (name && name !== request.name) {
      updateRequest(request.id, { name });
    }
    setRenaming(false);
  };

  if (renaming) {
    return (
      <div className="px-2 py-1.5">
        <input
          autoFocus
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={commitRename}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitRename();
            if (event.key === "Escape") setRenaming(false);
          }}
          className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs"
          data-testid="rename-api-input"
        />
      </div>
    );
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(request.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onOpen(request.id);
        }}
        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
        data-testid={`api-row-${request.id}`}
        onContextMenu={(event) => {
          event.preventDefault();
          setContextMenu({ x: event.clientX, y: event.clientY });
        }}
      >
        <MethodBadge method={request.method} />
        <span className="min-w-0 flex-1 truncate text-xs font-medium">
          {displayText ?? request.name}
        </span>
      </div>
      {contextMenu ? (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 min-w-40 rounded-md border border-border bg-popover p-2 shadow-md"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => {
                setContextMenu(null);
                setDraftName(request.name);
                setRenaming(true);
              }}
              title="Rename"
            >
              <Pencil className="h-3.5 w-3.5" />
              Rename
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-destructive hover:bg-accent"
              onClick={() => {
                setContextMenu(null);
                deleteRequest(request.id);
              }}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}

export function CollectionTree() {
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const requests = useWorkspaceStore((state) => state.requests);
  const openRequest = useWorkspaceStore((state) => state.openRequest);
  const addFolder = useWorkspaceStore((state) => state.addFolder);
  const createRequest = useWorkspaceStore((state) => state.createRequest);
  const renameFolder = useWorkspaceStore((state) => state.renameFolder);
  const renameCollection = useWorkspaceStore((state) => state.renameCollection);
  const addCollection = useWorkspaceStore((state) => state.addCollection);
  const deleteCollection = useWorkspaceStore((state) => state.deleteCollection);
  const environments = useWorkspaceStore((state) => state.environments);
  const activeEnvironmentId = useWorkspaceStore(
    (state) => state.activeEnvironmentId,
  );
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editingCollectionName, setEditingCollectionName] = useState("");
  const [collectionExportOpen, setCollectionExportOpen] = useState(false);
  const [collectionExportSelectedIds, setCollectionExportSelectedIds] = useState<string[]>([]);

  const workspace = workspaces.find(
    (item) => item.id === activeWorkspaceId,
  );

  if (!workspace) {
    return (
      <p className="px-2 text-sm text-muted-foreground">
        No workspace selected.
      </p>
    );
  }

  if (workspace.collections.length === 0) {
    return (
      <div className="space-y-5">
        <div className="mb-1.5 flex items-center justify-between px-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Projects
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => addCollection(workspace.id, `New Project ${workspace.collections.length + 1}`)}
            aria-label="Add project"
            data-testid="add-collection-button"
            title="Add project"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="px-2 text-sm text-muted-foreground">No collections in this workspace yet.</p>
      </div>
    );
  }

  const renderRequest = (request: ApiRequest) => {
    return (
      <ApiRow
        key={request.id}
        request={request}
        onOpen={(id) => openRequest(id)}
      />
    );
  };

  const handleCreateApi = (folderId: string) => {
    const id = createRequest(
      {
        name: "New API",
        method: "GET",
        url: "{{baseUrl}}/new-endpoint",
        headers: [],
        queryParams: [],
        options: {
          timeoutMs: 30000,
          followRedirects: true,
          maxRedirects: 10,
          tlsVerification: true,
          maxResponseBytes: 10485760,
        },
      },
      folderId,
    );
    openRequest(id);
  };

  const handleRenameFolder = (folderId: string, name: string) => {
    renameFolder(folderId, name);
  };

  const handleExport = (folderId: string) => {
    const collection = workspace?.collections.find((item) =>
      (item.folders ?? []).some((folder) => folder.id === folderId),
    );
    const folder = collection?.folders?.find((item) => item.id === folderId);
    if (!collection || !folder) return;
    const exportedRequests = folder.requestIds
      .map((requestId) => requests.find((item) => item.id === requestId))
      .filter((item): item is ApiRequest => Boolean(item));
    const environment = environments.find((item) => item.id === activeEnvironmentId) ?? environments[0];
    if (!environment) return;
    exportRequestsAsPostman(exportedRequests, environment, folder.name);
  };

  const handleExportRequests = (
    selectedRequests: ApiRequest[],
    collectionName: string,
  ) => {
    const environment =
      environments.find((item) => item.id === activeEnvironmentId) ?? environments[0];
    if (!environment) return;
    exportRequestsAsPostman(selectedRequests, environment, collectionName);
  };

  const handleRenameCollection = (collectionId: string, name: string) => {
    renameCollection(collectionId, name);
  };

  const getCollectionRequests = (collectionId: string): ApiRequest[] => {
    const collection = workspace?.collections.find((item) => item.id === collectionId);
    if (!collection) return [];
    const folderRequests = (collection.folders ?? []).flatMap((folder) =>
      (folder.requestIds ?? [])
        .map((requestId) => requests.find((item) => item.id === requestId))
        .filter((item): item is ApiRequest => Boolean(item)),
    );
    const directRequests = (collection.requestIds ?? [])
      .map((requestId) => requests.find((item) => item.id === requestId))
      .filter((item): item is ApiRequest => Boolean(item));
    return [...directRequests, ...folderRequests];
  };

  const handleExportCollection = (collectionId: string) => {
    const collection = workspace?.collections.find((item) => item.id === collectionId);
    if (!collection) return;
    const exportedRequests = getCollectionRequests(collectionId);
    const environment = environments.find((item) => item.id === activeEnvironmentId) ?? environments[0];
    if (!environment) return;
    exportRequestsAsPostman(exportedRequests, environment, collection.name);
  };

  const handleExportCollectionRequests = (
    selectedRequests: ApiRequest[],
    collectionName: string,
  ) => {
    const environment =
      environments.find((item) => item.id === activeEnvironmentId) ?? environments[0];
    if (!environment) return;
    exportRequestsAsPostman(selectedRequests, environment, collectionName);
  };

  return (
    <div className="space-y-5">
      <div className="mb-1.5 flex items-center justify-between px-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Projects
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => addCollection(workspace.id, `New Project ${workspace.collections.length + 1}`)}
          aria-label="Add project"
          data-testid="add-collection-button"
          title="Add project"
        >
          <FolderPlus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {workspace.collections.map((collection) => {
        const folders = collection.folders ?? [];
        const collectionRequests = collection.requestIds
          .map((id) => requests.find((request) => request.id === id))
          .filter((request): request is ApiRequest => Boolean(request));

        const hasFolders = folders.length > 0;

        return (
          <div key={collection.id} className="relative">
            <div className="mb-1.5 flex items-center justify-between px-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {editingCollectionId === collection.id ? (
                  <input
                    autoFocus
                    value={editingCollectionName}
                    onChange={(event) => setEditingCollectionName(event.target.value)}
                    onBlur={() => {
                      const name = editingCollectionName.trim();
                      if (name && name !== collection.name) {
                        handleRenameCollection(collection.id, name);
                      }
                      setEditingCollectionId(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        const name = editingCollectionName.trim();
                        if (name && name !== collection.name) {
                          handleRenameCollection(collection.id, name);
                        }
                        setEditingCollectionId(null);
                      }
                      if (event.key === "Escape") setEditingCollectionId(null);
                    }}
                    className="h-7 w-44 rounded-md border border-input bg-background px-2 text-xs"
                    data-testid="rename-collection-input"
                  />
                ) : (
                  <span
                    className="cursor-pointer"
                    onClick={() => {
                      setEditingCollectionId(collection.id);
                      setEditingCollectionName(collection.name);
                    }}
                  >
                    {collection.name}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setCollectionExportOpen(true)}
                  aria-label={`Export ${collection.name}`}
                  data-testid={`export-collection-button-${collection.id}`}
                  title={`Export ${collection.name}`}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setEditingCollectionId(collection.id);
                    setEditingCollectionName(collection.name);
                  }}
                  aria-label={`Edit ${collection.name}`}
                  data-testid={`rename-collection-button-${collection.id}`}
                  title={`Edit ${collection.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => deleteCollection(collection.id)}
                  aria-label={`Delete ${collection.name}`}
                  data-testid={`delete-collection-button-${collection.id}`}
                  title={`Delete ${collection.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => exportRequestsAsMarkdown(collectionRequests, collection.name)}
                  aria-label="Export API docs"
                  data-testid={`export-docs-button-${collection.id}`}
                  title="Export API docs"
                >
                  <FileText className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => addFolder(collection.id, `New Folder ${folders.length + 1}`)}
                  aria-label="Add folder"
                  data-testid="add-folder-button"
                  title="Add folder"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {collectionExportOpen ? (
              <div
                className="absolute right-0 top-full z-50 mt-1 w-72 rounded-md border border-border bg-popover p-2 shadow-md"
                data-testid={`export-chooser-collection-${collection.id}`}
              >
                <div className="mb-1 flex items-center justify-between px-1">
                  <span className="text-xs font-medium">Export from {collection.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => {
                      setCollectionExportOpen(false);
                      setCollectionExportSelectedIds([]);
                    }}
                    aria-label="Close export dialog"
                    data-testid={`close-collection-export-chooser-${collection.id}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mb-1 w-full justify-start"
                  onClick={() => {
                    setCollectionExportOpen(false);
                    setCollectionExportSelectedIds([]);
                    handleExportCollection(collection.id);
                  }}
                >
                  Export All
                </Button>
                <div className="max-h-56 overflow-auto">
                  {getCollectionRequests(collection.id).map((request) => {
                    const checked = collectionExportSelectedIds.includes(request.id);
                    return (
                      <label
                        key={request.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs hover:bg-accent"
                        data-testid={`collection-export-option-${request.id}`}
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5"
                          checked={checked}
                          onChange={(event) => {
                            if (event.target.checked) {
                              setCollectionExportSelectedIds((prev) =>
                                prev.includes(request.id) ? prev : [...prev, request.id],
                              );
                            } else {
                              setCollectionExportSelectedIds((prev) =>
                                prev.filter((id) => id !== request.id),
                              );
                            }
                          }}
                        />
                        <MethodBadge method={request.method} />
                        <span className="min-w-0 flex-1 truncate">{request.name}</span>
                      </label>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 w-full justify-start"
                  disabled={collectionExportSelectedIds.length === 0}
                  onClick={() => {
                    setCollectionExportOpen(false);
                    setCollectionExportSelectedIds([]);
                    const selected = getCollectionRequests(collection.id).filter((item) =>
                      collectionExportSelectedIds.includes(item.id),
                    );
                    handleExportCollectionRequests(selected, collection.name);
                  }}
                >
                  Export Selected ({collectionExportSelectedIds.length})
                </Button>
              </div>
            ) : null}
            <div className="space-y-0.5">
              {hasFolders ? (
                folders.map((folder) => (
                  <div key={folder.id}>
                    <FolderRow
                      folderId={folder.id}
                      folderName={folder.name}
                      folderRequests={folder.requestIds
                        .map((requestId) => requests.find((r) => r.id === requestId))
                        .filter((r): r is ApiRequest => Boolean(r))}
                      onCreateApi={handleCreateApi}
                      onRenameFolder={handleRenameFolder}
                      onExport={handleExport}
                      onExportRequests={handleExportRequests}
                    />
                  </div>
                ))
              ) : (
                collectionRequests.map((request) => renderRequest(request))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
