import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Bot, History, Moon, Search, Settings, SlidersHorizontal, Sun } from "lucide-react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";

interface Command {
  id: string;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const toggleTheme = useWorkspaceStore((state) => state.setTheme);
  const theme = useWorkspaceStore((state) => state.theme);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(
    () => [
      {
        id: "nav-explorer",
        title: "Go to API Explorer",
        subtitle: "OpenAPI operations",
        icon: <BookOpen className="h-4 w-4 text-muted-foreground" />,
        action: () => navigate("/openapi"),
      },
      {
        id: "nav-environments",
        title: "Go to Environment Manager",
        subtitle: "Tokens and variables",
        icon: <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />,
        action: () => navigate("/environments"),
      },
      {
        id: "nav-history",
        title: "Go to History",
        subtitle: "Past requests",
        icon: <History className="h-4 w-4 text-muted-foreground" />,
        action: () => navigate("/history"),
      },
      {
        id: "nav-settings",
        title: "Go to Settings",
        icon: <Settings className="h-4 w-4 text-muted-foreground" />,
        action: () => navigate("/settings"),
      },
      {
        id: "theme-toggle",
        title: theme === "dark" ? "Switch to Light theme" : "Switch to Dark theme",
        subtitle: "Appearance",
        icon: theme === "dark" ? (
          <Sun className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Moon className="h-4 w-4 text-muted-foreground" />
        ),
        action: () => toggleTheme(theme === "dark" ? "light" : "dark"),
      },
      {
        id: "ai-toggle",
        title: "Toggle AI panel",
        subtitle: "Assistant",
        icon: <Bot className="h-4 w-4 text-muted-foreground" />,
        action: () => useWorkspaceStore.getState().toggleAiPanel(),
      },
    ],
    [navigate, theme, toggleTheme],
  );

  const filteredCommands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return commands;
    return commands.filter(
      (command) =>
        command.title.toLowerCase().includes(normalizedQuery) ||
        command.subtitle?.toLowerCase().includes(normalizedQuery),
    );
  }, [commands, query]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const focusFrame = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(focusFrame);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[12vh]"
      data-testid="command-palette"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-[560px] max-w-full rounded-lg border border-border bg-popover p-2 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type a command…"
            className="h-8 flex-1 bg-transparent text-sm outline-none"
            data-testid="command-palette-input"
          />
        </div>
        <div className="mt-2 max-h-72 overflow-auto">
          {filteredCommands.map((command) => (
            <button
              key={command.id}
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
              onClick={() => {
                setOpen(false);
                command.action();
              }}
              data-testid={`command-${command.id}`}
            >
              {command.icon}
              <span className="flex-1">{command.title}</span>
              {command.subtitle ? (
                <span className="text-xs text-muted-foreground">{command.subtitle}</span>
              ) : null}
            </button>
          ))}
          {filteredCommands.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">No commands found.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
