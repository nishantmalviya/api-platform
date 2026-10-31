import { useState } from "react";
import { Play, Plus, Trash2 } from "lucide-react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { executeWorkflow, type WorkflowStep, type WorkflowStepResult } from "@/features/workflows/lib/workflow";

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function WorkflowBuilder() {
  const requests = useWorkspaceStore((state) => state.requests);
  const environments = useWorkspaceStore((state) => state.environments);

  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: createId("wf_step"),
      requestId: "req_list_payments",
      retryCount: 1,
      assertions: [{ id: "wf_assert_status", type: "status", expectedStatus: 200 }],
    },
  ]);
  const [results, setResults] = useState<WorkflowStepResult[] | null>(null);

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        id: createId("wf_step"),
        requestId: requests[0]?.id ?? "",
        retryCount: 1,
        assertions: [],
      },
    ]);
  };

  const updateStep = (id: string, patch: Partial<WorkflowStep>) => {
    setSteps((prev) => prev.map((step) => (step.id === id ? { ...step, ...patch } : step)));
  };

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((step) => step.id !== id));
  };

  const runWorkflow = async () => {
    const result = await executeWorkflow(steps, requests, environments);
    setResults(result.steps);
  };

  return (
    <div className="space-y-2 rounded-md border border-border p-3" data-testid="workflow-builder">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Workflow
        </h4>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={addStep}
            disabled={requests.length === 0}
            data-testid="add-workflow-step-button"
          >
            <Plus className="h-3.5 w-3.5" />
            Add step
          </Button>
          <Button
            size="sm"
            onClick={() => void runWorkflow()}
            disabled={steps.length === 0 || steps.some((step) => !step.requestId)}
            data-testid="run-workflow-button"
          >
            <Play className="h-3.5 w-3.5" />
            Run
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex items-center gap-2 rounded-md border border-border p-2"
            data-testid={`workflow-step-${step.id}`}
          >
            <Select
              value={step.requestId}
              onChange={(event) => updateStep(step.id, { requestId: event.target.value })}
              className="h-8 flex-1"
              data-testid={`workflow-step-request-${step.id}`}
            >
              {requests.map((request) => (
                <option key={request.id} value={request.id}>
                  {request.name}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              min={0}
              value={step.retryCount}
              onChange={(event) =>
                updateStep(step.id, { retryCount: Math.max(0, Number(event.target.value) || 0) })
              }
              className="h-8 w-20"
              data-testid={`workflow-step-retry-${step.id}`}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeStep(step.id)}
              aria-label="Remove workflow step"
              data-testid={`remove-workflow-step-${step.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {results ? (
        <div className="space-y-1 rounded-md border border-border p-3" data-testid="workflow-results">
          {results.map((result) => (
            <div
              key={result.stepId}
              className="flex items-center gap-2 text-sm"
              data-testid={`workflow-result-${result.stepId}`}
            >
              <span
                className={
                  result.status === "passed" ? "text-emerald-600" : "text-destructive"
                }
              >
                {result.status === "passed" ? "PASS" : "FAIL"}
              </span>
              <span className="flex-1">{result.requestName}</span>
              {result.durationMs !== undefined ? (
                <span className="text-xs text-muted-foreground">{result.durationMs}ms</span>
              ) : null}
              {result.message ? <span className="text-xs text-muted-foreground">{result.message}</span> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
