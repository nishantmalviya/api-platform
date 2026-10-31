import { Bot, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";

interface AgentDefinition {
  id: string;
  name: string;
  phase: string;
  goal: string;
  status: "planned" | "available";
}

const AGENTS: AgentDefinition[] = [
  {
    id: "api-builder",
    name: "API Builder",
    phase: "P0",
    goal: "Turn natural-language requirements into valid API request drafts.",
    status: "planned",
  },
  {
    id: "api-debugger",
    name: "API Debugger",
    phase: "P0",
    goal: "Diagnose failed API requests and suggest actionable fixes.",
    status: "planned",
  },
  {
    id: "test-generator",
    name: "Test Generator",
    phase: "P0",
    goal: "Generate deterministic API test cases.",
    status: "planned",
  },
  {
    id: "openapi-analyst",
    name: "OpenAPI Analyst",
    phase: "P1",
    goal: "Understand API specifications and produce usable collections.",
    status: "planned",
  },
  {
    id: "workflow-builder",
    name: "Workflow Builder",
    phase: "P1",
    goal: "Build multi-step API scenarios with dependencies.",
    status: "planned",
  },
];

export function AssistantPanel() {
  const aiPanelOpen = useWorkspaceStore((state) => state.aiPanelOpen);
  const toggleAiPanel = useWorkspaceStore((state) => state.toggleAiPanel);

  if (!aiPanelOpen) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <Bot className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          AI assistant is collapsed. Toggle the AI panel to review available
          agents.
        </p>
        <Button variant="outline" size="sm" onClick={toggleAiPanel}>
          Open AI panel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Bot className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">AI Workspace</h2>
        <Badge variant="secondary" className="ml-auto">
          Phase 4
        </Badge>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/50 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            The AI layer is intentionally non-functional until the native
            execution engine and security contracts are validated. Agents will
            run through the controlled tool gateway with strict schemas,
            redaction, approvals, and execution budgets.
          </p>
        </div>
        <ul className="mt-4 space-y-2">
          {AGENTS.map((agent) => (
            <li
              key={agent.id}
              className="rounded-md border border-border p-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{agent.name}</span>
                <Badge variant="outline" className="ml-auto">
                  {agent.phase}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{agent.goal}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
