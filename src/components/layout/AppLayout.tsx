import { useNavigate } from "react-router-dom";
import { Blocks, BookOpen, Bot, History, Moon, PanelLeftClose, PanelLeftOpen, SlidersHorizontal, Sun } from "lucide-react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CollectionTree } from "@/features/collections/components/CollectionTree";
import { EnvironmentSwitcher } from "@/features/collections/components/EnvironmentSwitcher";
import { RequestEditor } from "@/features/requests/components/RequestEditor";
import { ResponseViewer } from "@/features/requests/components/ResponseViewer";
import { AssistantPanel } from "@/features/agents/components/AssistantPanel";
import { CommandPalette } from "@/components/command-palette/CommandPalette";

export function AppLayout() {
  const theme = useWorkspaceStore((state) => state.theme);
  const setTheme = useWorkspaceStore((state) => state.setTheme);
  const aiPanelOpen = useWorkspaceStore((state) => state.aiPanelOpen);
  const toggleAiPanel = useWorkspaceStore((state) => state.toggleAiPanel);
  const sidebarCollapsed = useWorkspaceStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useWorkspaceStore((state) => state.toggleSidebar);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const activeTabId = useWorkspaceStore((state) => state.activeTabId);
  const navigate = useNavigate();

  const workspace = useWorkspaceStore(
    (state) => state.workspaces.find((item) => item.id === activeWorkspaceId),
  );

  return (
    <div
      className={cn(
        "flex h-screen w-screen overflow-hidden bg-background text-foreground",
        theme === "dark" && "dark",
      )}
    >
      {!sidebarCollapsed && (
        <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-card">
          <div className="flex h-12 items-center gap-2 border-b border-border px-4">
            <Blocks className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">API Studio</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <CollectionTree />
          </div>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">
              {workspace?.name ?? "API Studio"}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              AI-native API development platform
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/openapi")}
              aria-label="Open API explorer"
              data-testid="nav-openapi-button"
              title="Open API explorer"
            >
              <BookOpen className="h-4 w-4" />
            </Button>
            <EnvironmentSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/history")}
              aria-label="Open history"
              title="Open history"
            >
              <History className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/environments")}
              aria-label="Open environment manager"
              title="Open environment manager"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAiPanel}
              aria-label="Toggle AI panel"
              title="Toggle AI panel"
            >
              <Bot className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 gap-2 overflow-hidden p-2">
          <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            {activeTabId ? (
              <RequestEditor requestId={activeTabId} />
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-border bg-card text-sm text-muted-foreground">
                Select a request from the explorer to start building.
              </div>
            )}
            <ResponseViewer requestId={activeTabId ?? ""} />
          </section>
          {aiPanelOpen && (
            <aside className="flex w-80 shrink-0 flex-col rounded-lg border border-border bg-card">
              <AssistantPanel />
            </aside>
          )}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
