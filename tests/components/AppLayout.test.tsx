import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppLayout } from "@/components/layout/AppLayout";

describe("AppLayout", () => {
  it("renders the main application shell", () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    );

    expect(screen.getByText("API Studio")).toBeInTheDocument();
    expect(screen.getByText("Payments Workspace", { selector: "h1" })).toBeInTheDocument();
    expect(screen.getByTestId("workspace-select")).toBeInTheDocument();
    expect(screen.getByTestId("send-button")).toBeInTheDocument();
    expect(screen.getByTestId("url-input")).toBeInTheDocument();
  });
});
