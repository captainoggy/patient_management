import { describe, expect, it } from "vitest";

import { messageFromDrfBody, messageFromSaveError } from "./drfErrors";
import { ApiError } from "./http";

describe("messageFromDrfBody", () => {
  it("uses string detail", () => {
    expect(messageFromDrfBody({ detail: "Not found." })).toBe("Not found.");
  });

  it("joins string list detail", () => {
    expect(messageFromDrfBody({ detail: ["a", "b"] })).toBe("a b");
  });

  it("collects field errors", () => {
    expect(
      messageFromDrfBody({
        first_name: ["Required."],
        last_name: "Too long.",
      }),
    ).toBe("Required. Too long.");
  });

  it("returns fallback for empty object", () => {
    expect(messageFromDrfBody({})).toBe("Save failed. Check the form and try again.");
  });
});

describe("messageFromSaveError", () => {
  it("unwraps ApiError", () => {
    const err = new ApiError("x", 400, { detail: "Bad" });
    expect(messageFromSaveError(err)).toBe("Bad");
  });

  it("uses generic for unknown", () => {
    expect(messageFromSaveError(new Error("x"))).toBe("Save failed. Try again.");
  });
});
