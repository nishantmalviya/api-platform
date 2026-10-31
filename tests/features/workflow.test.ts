import { describe, expect, it } from "vitest";
import { executeWorkflow } from "@/features/workflows/lib/workflow";

describe("executeWorkflow", () => {
  it("fails deterministically when a step request is missing", async () => {
    const result = await executeWorkflow(
      [{ id: "wf_step_1", requestId: "req_missing", retryCount: 2, assertions: [] }],
      [],
      [],
    );
    expect(result.success).toBe(false);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].status).toBe("failed");
    expect(result.steps[0].message).toBe("Step request not found");
  });
});
