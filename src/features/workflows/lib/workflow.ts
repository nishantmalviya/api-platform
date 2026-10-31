import { executeApiRequest } from "@/features/requests/api/httpClient";
import { runResponseAssertions, type ResponseAssertion } from "@/features/requests/lib/assertions";
import type { ApiRequest } from "@/contracts/api";
import type { Environment } from "@/types/workspace";

export interface WorkflowStep {
  id: string;
  requestId: string;
  retryCount: number;
  assertions: ResponseAssertion[];
}

export interface WorkflowStepResult {
  stepId: string;
  requestName: string;
  status: "passed" | "failed";
  durationMs?: number;
  message?: string;
}

export interface WorkflowExecutionResult {
  steps: WorkflowStepResult[];
  success: boolean;
}

/**
 * Executes a deterministic visual workflow: each step runs a saved request,
 * evaluates assertions, and stops at the first failing step.
 */
export async function executeWorkflow(
  steps: WorkflowStep[],
  requests: ApiRequest[],
  environments: Environment[],
): Promise<WorkflowExecutionResult> {
  const results: WorkflowStepResult[] = [];

  for (const step of steps) {
    const request = requests.find((item) => item.id === step.requestId);
    if (!request) {
      results.push({
        stepId: step.id,
        requestName: step.requestId,
        status: "failed",
        message: "Step request not found",
      });
      break;
    }

    const environment = environments.find((item) => item.id === request.environmentId) ?? environments[0];
    let outcome: Awaited<ReturnType<typeof executeApiRequest>> | undefined;
    let failureMessage: string | undefined;

    for (let attempt = 1; attempt <= Math.max(1, step.retryCount); attempt += 1) {
      try {
        outcome = await executeApiRequest(request, environment);
        break;
      } catch (error) {
        failureMessage = error instanceof Error ? error.message : "Execution error";
        if (attempt < Math.max(1, step.retryCount)) {
          continue;
        }
      }
    }

    if (!outcome) {
      results.push({
        stepId: step.id,
        requestName: request.name,
        status: "failed",
        message: failureMessage ?? "Execution failed",
      });
      break;
    }

    const assertionResults = runResponseAssertions(request, outcome.response, step.assertions);
    const failure = assertionResults.find((result) => !result.passed);
    results.push({
      stepId: step.id,
      requestName: request.name,
      status: failure ? "failed" : "passed",
      durationMs: outcome.response.durationMs,
      message: failure ? failure.message : "All assertions passed",
    });

    if (failure) {
      break;
    }
  }

  return { steps: results, success: results.every((result) => result.status === "passed") };
}
