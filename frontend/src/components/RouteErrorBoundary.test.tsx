import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RouteErrorBoundary } from "./RouteErrorBoundary";

function Explodes(): never {
  throw new Error("route boom");
}

describe("RouteErrorBoundary", () => {
  it("renders an alert when a child throws", () => {
    const ce = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <RouteErrorBoundary>
        <Explodes />
      </RouteErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong loading this screen.")).toBeInTheDocument();
    expect(screen.getByText("route boom")).toBeInTheDocument();
    ce.mockRestore();
  });
});
