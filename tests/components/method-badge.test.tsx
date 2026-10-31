import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MethodBadge } from "@/components/method-badge";

describe("MethodBadge", () => {
  it("renders the method text", () => {
    render(<MethodBadge method="PATCH" />);
    expect(screen.getByText("PATCH")).toBeInTheDocument();
  });

  it("renders all supported methods", () => {
    render(
      <div>
        <MethodBadge method="GET" />
        <MethodBadge method="POST" />
        <MethodBadge method="PUT" />
        <MethodBadge method="PATCH" />
        <MethodBadge method="DELETE" />
        <MethodBadge method="HEAD" />
        <MethodBadge method="OPTIONS" />
      </div>,
    );
    expect(screen.getByText("GET")).toBeInTheDocument();
    expect(screen.getByText("POST")).toBeInTheDocument();
    expect(screen.getByText("PUT")).toBeInTheDocument();
    expect(screen.getByText("PATCH")).toBeInTheDocument();
    expect(screen.getByText("DELETE")).toBeInTheDocument();
    expect(screen.getByText("HEAD")).toBeInTheDocument();
    expect(screen.getByText("OPTIONS")).toBeInTheDocument();
  });
});
