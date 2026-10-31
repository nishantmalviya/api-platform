import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ApiRequest, ApiResponse } from "@/contracts/api";
import type { ApiCollection, ApiFolder, Environment, EnvironmentVariable, HistoryEntry, Workspace } from "@/types/workspace";
import { apiStudioStorage } from "@/services/storage";
import { executeApiRequest } from "@/features/requests/api/httpClient";

export type Theme = "dark" | "light";

interface WorkspaceState {
  theme: Theme;
  aiPanelOpen: boolean;
  sidebarCollapsed: boolean;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  environments: Environment[];
  activeEnvironmentId: string;
  requests: ApiRequest[];
  history: HistoryEntry[];
  openTabs: string[];
  activeTabId: string | null;
  responses: Record<string, ApiResponse>;
  sendingRequestIds: string[];
  openApiDocument: Record<string, unknown> | null;
  favoriteRequestIds: string[];

  setTheme: (theme: Theme) => void;
  toggleAiPanel: () => void;
  toggleSidebar: () => void;
  setActiveWorkspace: (workspaceId: string) => void;
  setActiveEnvironment: (environmentId: string) => void;
  openRequest: (requestId: string) => void;
  closeTab: (requestId: string) => void;
  setActiveTab: (requestId: string) => void;
  updateRequest: (requestId: string, patch: Partial<ApiRequest>) => void;
  recordResponse: (requestId: string, response: ApiResponse) => void;
  addHistory: (entry: HistoryEntry) => void;
  clearHistory: () => void;
  importOpenApiDocument: (document: Record<string, unknown>) => void;
  clearOpenApiDocument: () => void;
  toggleFavoriteRequest: (requestId: string) => void;
  deleteRequest: (requestId: string) => void;
  deleteFolder: (folderId: string) => void;
  sendRequest: () => Promise<void>;
  addFolder: (collectionId: string, name: string) => string;
  addCollection: (workspaceId: string, name: string) => string;
  deleteCollection: (collectionId: string) => void;
  moveRequestToFolder: (requestId: string, folderId: string | null) => void;
  createRequest: (input: Omit<ApiRequest, "id">, folderId: string) => string;
  renameFolder: (folderId: string, name: string) => void;
  renameCollection: (collectionId: string, name: string) => void;
  upsertEnvironment: (environment: Environment) => void;
  deleteEnvironment: (environmentId: string) => void;
  setEnvironmentVariables: (environmentId: string, variables: EnvironmentVariable[]) => void;
}

type WorkspaceStore = WorkspaceState;

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      theme: "dark",
      aiPanelOpen: false,
      sidebarCollapsed: false,
      workspaces: [
        {
          id: "ws_payments",
          name: "Payments Workspace",
          collections: [
            {
              id: "col_payments",
              workspaceId: "ws_payments",
              name: "Payments API",
              requestIds: [
                "req_list_payments",
                "req_create_payment",
                "req_get_payment",
              ],
              folders: [
                {
                  id: "folder_payments",
                  collectionId: "col_payments",
                  name: "Payments",
                  requestIds: [
                    "req_list_payments",
                    "req_create_payment",
                    "req_get_payment",
                  ],
                },
              ],
            },
          ],
        },
      ],
      activeWorkspaceId: "ws_payments",
      environments: [
        {
          id: "env_development",
          name: "Development",
          variables: [
            { key: "baseUrl", value: "http://localhost:8080", secret: false },
            { key: "apiKey", value: "dev_test_api_key_9f8e7d6c5b4a", secret: true },
            { key: "bearer_token", value: "dev_bearer_token_abc123xyz", secret: true },
            { key: "basic_username", value: "test-user", secret: true },
            { key: "basic_password", value: "test-password", secret: true },
          ],
        },
        {
          id: "env_staging",
          name: "Staging",
          variables: [
            { key: "baseUrl", value: "https://api.staging.example.com", secret: false },
            { key: "apiKey", value: "sk_staging_1a2b3c4d5e6f7g8h", secret: true },
            { key: "bearer_token", value: "staging_bearer_token_xyz789", secret: true },
          ],
        },
        {
          id: "env_production",
          name: "Production",
          variables: [
            { key: "baseUrl", value: "https://api.example.com", secret: false },
            { key: "apiKey", value: "sk_prod_4c5d6e7f8g9h0i1j", secret: true },
            { key: "bearer_token", value: "prod_bearer_token_uvw012", secret: true },
          ],
        },
      ],
      activeEnvironmentId: "env_development",
      requests: [
        {
          id: "req_list_payments",
          name: "List Payments",
          method: "GET",
          url: "{{baseUrl}}/payments",
          headers: [
            { key: "Authorization", value: "Bearer {{bearer_token}}", enabled: true },
            { key: "Accept", value: "application/json", enabled: true },
          ],
          queryParams: [],
          auth: { type: "bearer", credentialRef: "bearer_token" },
          environmentId: "env_development",
          workspaceId: "ws_payments",
          collectionId: "col_payments",
          folderId: "folder_payments",
          options: {
            timeoutMs: 30000,
            followRedirects: true,
            maxRedirects: 10,
            tlsVerification: true,
            maxResponseBytes: 10485760,
          },
        },
        {
          id: "req_create_payment",
          name: "Create Payment",
          method: "POST",
          url: "{{baseUrl}}/payments",
          headers: [
            { key: "Authorization", value: "Bearer {{bearer_token}}", enabled: true },
            { key: "Content-Type", value: "application/json", enabled: true },
          ],
          queryParams: [],
          body: {
            type: "json",
            content: JSON.stringify(
              {
                amount: 100,
                currency: "USD",
                recipient: "test-user",
              },
              null,
              2,
            ),
          },
          auth: { type: "bearer", credentialRef: "bearer_token" },
          environmentId: "env_development",
          workspaceId: "ws_payments",
          collectionId: "col_payments",
          folderId: "folder_payments",
          options: {
            timeoutMs: 30000,
            followRedirects: true,
            maxRedirects: 10,
            tlsVerification: true,
            maxResponseBytes: 10485760,
          },
        },
        {
          id: "req_get_payment",
          name: "Get Payment",
          method: "GET",
          url: "{{baseUrl}}/payments/pay_123",
          headers: [
            { key: "Authorization", value: "Bearer {{bearer_token}}", enabled: true },
            { key: "Accept", value: "application/json", enabled: true },
          ],
          queryParams: [],
          auth: { type: "bearer", credentialRef: "bearer_token" },
          environmentId: "env_development",
          workspaceId: "ws_payments",
          collectionId: "col_payments",
          folderId: "folder_payments",
          options: {
            timeoutMs: 30000,
            followRedirects: true,
            maxRedirects: 10,
            tlsVerification: true,
            maxResponseBytes: 10485760,
          },
        },
      ],
      history: [],
      openTabs: ["req_list_payments"],
      activeTabId: "req_list_payments",
      responses: {},
      sendingRequestIds: [],

      setTheme: (theme) => set({ theme }),
      toggleAiPanel: () =>
        set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setActiveWorkspace: (workspaceId) =>
        set({ activeWorkspaceId: workspaceId }),
      setActiveEnvironment: (environmentId) =>
        set({ activeEnvironmentId: environmentId }),
      openRequest: (requestId) =>
        set((state) => {
          const request = state.requests.find((item) => item.id === requestId);
          const workspaceId = request?.workspaceId ?? state.activeWorkspaceId;
          return {
            openTabs: state.openTabs.includes(requestId)
              ? state.openTabs
              : [...state.openTabs, requestId],
            activeTabId: requestId,
            activeWorkspaceId: workspaceId,
          };
        }),
      closeTab: (requestId) =>
        set((state) => {
          const index = state.openTabs.indexOf(requestId);
          const openTabs = state.openTabs.filter((id) => id !== requestId);
          const fallback =
            openTabs[Math.min(index, openTabs.length - 1)] ?? null;
          const activeTabId =
            state.activeTabId === requestId ? fallback : state.activeTabId;
          return { openTabs, activeTabId };
        }),
      setActiveTab: (requestId) => set({ activeTabId: requestId }),
      updateRequest: (requestId, patch) =>
        set((state) => ({
          requests: state.requests.map((request) =>
            request.id === requestId ? { ...request, ...patch } : request,
          ),
        })),
      recordResponse: (requestId, response) =>
        set((state) => ({
          responses: { ...state.responses, [requestId]: response },
        })),
      addHistory: (entry) =>
        set((state) => ({ history: [entry, ...state.history].slice(0, 200) })),
      clearHistory: () => set({ history: [] }),
      openApiDocument: null,
      importOpenApiDocument: (document) => set({ openApiDocument: document }),
      clearOpenApiDocument: () => set({ openApiDocument: null }),
      favoriteRequestIds: ["req_list_payments", "req_create_payment", "req_get_payment"],
      toggleFavoriteRequest: (requestId) =>
        set((state) => ({
          favoriteRequestIds: state.favoriteRequestIds.includes(requestId)
            ? state.favoriteRequestIds.filter((id) => id !== requestId)
            : [...state.favoriteRequestIds, requestId],
        })),
      deleteRequest: (requestId) =>
        set((state) => ({
          requests: state.requests.filter((item) => item.id !== requestId),
          responses: Object.fromEntries(
            Object.entries(state.responses).filter(([key]) => key !== requestId),
          ),
          sendingRequestIds: state.sendingRequestIds.filter((id) => id !== requestId),
          openTabs: state.openTabs.filter((id) => id !== requestId),
          activeTabId: state.activeTabId === requestId ? null : state.activeTabId,
          favoriteRequestIds: state.favoriteRequestIds.filter((id) => id !== requestId),
          workspaces: state.workspaces.map((workspace) => ({
            ...workspace,
            collections: workspace.collections.map((collection) => ({
              ...collection,
              requestIds: (collection.requestIds ?? []).filter((id) => id !== requestId),
              folders: (collection.folders ?? [])
                .map((folder) => ({
                  ...folder,
                  requestIds: folder.requestIds.filter((id) => id !== requestId),
                }))
                .filter((folder) => folder.requestIds.length > 0),
            })),
          })),
        })),
      deleteFolder: (folderId) =>
        set((state) => ({
          workspaces: state.workspaces.map((workspace) => ({
            ...workspace,
            collections: workspace.collections.map((collection) => ({
              ...collection,
              folders: (collection.folders ?? []).filter((folder) => folder.id !== folderId),
            })),
          })),
        })),
      addFolder: (collectionId, name) => {
        const folder: ApiFolder = {
          id: createId("folder"),
          collectionId,
          name,
          requestIds: [],
        };
        set((state) => ({
          workspaces: state.workspaces.map((workspace) => ({
            ...workspace,
            collections: workspace.collections.map((collection) =>
              collection.id === collectionId
                ? { ...collection, folders: [...(collection.folders ?? []), folder] }
                : collection,
            ),
          })),
        }));
        return folder.id;
      },
      addCollection: (workspaceId, name) => {
        const collection: ApiCollection = {
          id: createId("col"),
          workspaceId,
          name,
          requestIds: [],
        };
        set((state) => ({
          workspaces: state.workspaces.map((workspace) =>
            workspace.id === workspaceId
              ? { ...workspace, collections: [...workspace.collections, collection] }
              : workspace,
          ),
        }));
        return collection.id;
      },
      deleteCollection: (collectionId) =>
        set((state) => {
          const collection = state.workspaces
            .flatMap((workspace) => workspace.collections)
            .find((item) => item.id === collectionId);
          const requestIdsToDelete = new Set<string>();
          if (collection) {
            for (const id of collection.requestIds ?? []) {
              requestIdsToDelete.add(id);
            }
            for (const folder of collection.folders ?? []) {
              for (const id of folder.requestIds ?? []) {
                requestIdsToDelete.add(id);
              }
            }
          }
          const shouldClearActiveTab =
            state.activeTabId !== null && requestIdsToDelete.has(state.activeTabId);
          return {
            requests: state.requests.filter((item) => !requestIdsToDelete.has(item.id)),
            responses: Object.fromEntries(
              Object.entries(state.responses).filter(([key]) => !requestIdsToDelete.has(key)),
            ),
            sendingRequestIds: state.sendingRequestIds.filter((id) => !requestIdsToDelete.has(id)),
            openTabs: state.openTabs.filter((id) => !requestIdsToDelete.has(id)),
            activeTabId: shouldClearActiveTab ? null : state.activeTabId,
            favoriteRequestIds: state.favoriteRequestIds.filter((id) => !requestIdsToDelete.has(id)),
            workspaces: state.workspaces.map((workspace) => ({
              ...workspace,
              collections: workspace.collections
                .filter((item) => item.id !== collectionId)
                .map((item) => ({
                  ...item,
                  requestIds: (item.requestIds ?? []).filter((id) => !requestIdsToDelete.has(id)),
                  folders: (item.folders ?? [])
                    .map((folder) => ({
                      ...folder,
                      requestIds: (folder.requestIds ?? []).filter((id) => !requestIdsToDelete.has(id)),
                    }))
                    .filter((folder) => (folder.requestIds ?? []).length > 0),
                })),
            })),
          };
        }),
      moveRequestToFolder: (requestId, folderId) => {
        set((state) => ({
          workspaces: state.workspaces.map((workspace) => ({
            ...workspace,
            collections: workspace.collections.map((collection) => {
              const folders = (collection.folders ?? [])
                .map((folder) =>
                  folder.id === folderId
                    ? {
                        ...folder,
                        requestIds: [
                          ...folder.requestIds.filter((id) => id !== requestId),
                          requestId,
                        ],
                      }
                    : {
                        ...folder,
                        requestIds: folder.requestIds.filter((id) => id !== requestId),
                      },
                )
                .filter((folder) => folder.id !== folderId || folder.requestIds.length > 0);
              const wasInCollectionLevel = (collection.requestIds ?? []).includes(requestId);
              return {
                ...collection,
                requestIds: wasInCollectionLevel
                  ? collection.requestIds.filter((id) => id !== requestId)
                  : collection.requestIds,
                folders,
              };
            }),
          })),
        }));
      },
      createRequest: (input, folderId) => {
        const id = createId("req");
        const owningCollection = get().workspaces
          .flatMap((workspace) => workspace.collections)
          .find((collection) => (collection.folders ?? []).some((folder) => folder.id === folderId));
        const request: ApiRequest = {
          ...input,
          id,
          workspaceId: input.workspaceId ?? owningCollection?.workspaceId,
          collectionId: input.collectionId ?? owningCollection?.id,
          folderId: input.folderId ?? folderId,
        };
        set((state) => ({
          requests: [...state.requests, request],
          workspaces: state.workspaces.map((workspace) => ({
            ...workspace,
            collections: workspace.collections.map((collection) => ({
              ...collection,
              folders: (collection.folders ?? []).map((folder) =>
                folder.id === folderId
                  ? { ...folder, requestIds: [...folder.requestIds, id] }
                  : folder,
              ),
            })),
          })),
        }));
        return id;
      },
      renameFolder: (folderId, name) => {
        set((state) => ({
          workspaces: state.workspaces.map((workspace) => ({
            ...workspace,
            collections: workspace.collections.map((collection) => ({
              ...collection,
              folders: (collection.folders ?? []).map((folder) =>
                folder.id === folderId ? { ...folder, name } : folder,
              ),
            })),
          })),
        }));
      },
      renameCollection: (collectionId, name) => {
        set((state) => ({
          workspaces: state.workspaces.map((workspace) => ({
            ...workspace,
            collections: workspace.collections.map((collection) =>
              collection.id === collectionId ? { ...collection, name } : collection,
            ),
          })),
        }));
      },
      upsertEnvironment: (environment) =>
        set((state) => ({
          environments: state.environments.some((item) => item.id === environment.id)
            ? state.environments.map((item) =>
                item.id === environment.id ? environment : item,
              )
            : [...state.environments, environment],
          activeEnvironmentId: environment.id,
        })),
      deleteEnvironment: (environmentId) =>
        set((state) => ({
          environments: state.environments.filter((item) => item.id !== environmentId),
          activeEnvironmentId:
            state.activeEnvironmentId === environmentId
              ? state.environments.find((item) => item.id !== environmentId)?.id ?? state.environments[0]?.id ?? ""
              : state.activeEnvironmentId,
        })),
      setEnvironmentVariables: (environmentId, variables) =>
        set((state) => ({
          environments: state.environments.map((item) =>
            item.id === environmentId ? { ...item, variables } : item,
          ),
        })),
      sendRequest: async () => {
        const { activeTabId, requests, environments, activeEnvironmentId, sendingRequestIds } =
          get();
        const request = requests.find((item) => item.id === activeTabId);
        if (!request) return;
        const environment =
          environments.find((item) => item.id === activeEnvironmentId) ??
          environments[0];
        if (!environment) return;
        if (sendingRequestIds.includes(request.id)) return;

        set({ sendingRequestIds: [...sendingRequestIds, request.id] });
        try {
          const { response, finalUrl } = await executeApiRequest(
            request,
            environment,
          );
          set((state) => ({
            responses: { ...state.responses, [request.id]: response },
            sendingRequestIds: state.sendingRequestIds.filter(
              (id) => id !== request.id,
            ),
          }));
          const historyEntry: HistoryEntry = {
            id: createId("history"),
            timestamp: Date.now(),
            requestId: request.id,
            method: request.method,
            url: finalUrl,
            status: response.status,
            statusText: response.statusText,
            durationMs: response.durationMs,
            sizeBytes: response.sizeBytes,
          };
          set((state) => ({ history: [historyEntry, ...state.history].slice(0, 200) }));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Network error";
          const errorResponse: ApiResponse = {
            requestId: request.id,
            status: 0,
            statusText: message,
            headers: {},
            durationMs: 0,
            truncated: false,
            sizeBytes: 0,
          };
          set((state) => ({
            responses: { ...state.responses, [request.id]: errorResponse },
            sendingRequestIds: state.sendingRequestIds.filter(
              (id) => id !== request.id,
            ),
          }));
          const historyEntry: HistoryEntry = {
            id: createId("history"),
            timestamp: Date.now(),
            requestId: request.id,
            method: request.method,
            url: request.url,
            status: 0,
            statusText: message,
            durationMs: 0,
            sizeBytes: 0,
          };
          set((state) => ({ history: [historyEntry, ...state.history].slice(0, 200) }));
        } finally {
          set((state) => ({
            sendingRequestIds: state.sendingRequestIds.filter(
              (id) => id !== request.id,
            ),
          }));
        }
      },
    }),
    {
      name: "api-studio",
      storage: createJSONStorage(() => apiStudioStorage),
      partialize: (state) => ({
        ...state,
        responses: {},
        sendingRequestIds: [],
      }),
    },
  ),
);
