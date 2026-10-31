import type { HttpMethod } from "@/contracts/api";

export interface EnvironmentVariable {
  key: string;
  value: string;
  secret: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
}

export interface ApiCollection {
  id: string;
  workspaceId: string;
  name: string;
  requestIds: string[];
  folders?: ApiFolder[];
}

export interface ApiFolder {
  id: string;
  collectionId: string;
  name: string;
  requestIds: string[];
}

export interface Workspace {
  id: string;
  name: string;
  collections: ApiCollection[];
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  requestId: string;
  method: HttpMethod;
  url: string;
  status: number;
  statusText: string;
  durationMs: number;
  sizeBytes: number;
}
