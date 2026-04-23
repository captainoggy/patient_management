import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiFetch, getCsrfToken } from "./http";

describe("getCsrfToken", () => {
  afterEach(() => {
    document.cookie = "";
  });

  it("returns null when absent", () => {
    expect(getCsrfToken()).toBeNull();
  });

  it("decodes cookie value", () => {
    document.cookie = "csrftoken=ab%2Bc";
    expect(getCsrfToken()).toBe("ab+c");
  });
});

describe("apiFetch", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("parses JSON body on success", async () => {
    fetchMock.mockResolvedValue(
      new Response('{"a":1}', { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    const data = await apiFetch<Record<string, number>>("/v1/health/");
    expect(data).toEqual({ a: 1 });
  });

  it("throws ApiError on error status with parsed body", async () => {
    fetchMock.mockResolvedValue(
      new Response('{"detail":"nope"}', {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await expect(apiFetch("/x")).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      body: { detail: "nope" },
    });
  });
});
