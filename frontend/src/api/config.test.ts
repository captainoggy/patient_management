import { describe, expect, it } from "vitest";

import { apiUrl } from "./config";

describe("apiUrl", () => {
  it("joins root and path with single slash", () => {
    const u = apiUrl("v1/patients");
    expect(u).toMatch(/\/v1\/patients$/);
    expect(u).not.toContain("//");
  });

  it("accepts path starting with /", () => {
    expect(apiUrl("/v1/health/")).toMatch(/\/v1\/health\/?$/);
  });
});
