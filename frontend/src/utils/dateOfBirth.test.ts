import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isDateOfBirthInFuture, todayIsoDateLocal } from "./dateOfBirth";

describe("dateOfBirth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15, 9, 0, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("todayIsoDateLocal is YYYY-MM-DD for frozen local date", () => {
    expect(todayIsoDateLocal()).toBe("2024-06-15");
  });

  it("rejects future DOB in local calendar", () => {
    expect(isDateOfBirthInFuture("2024-06-16")).toBe(true);
    expect(isDateOfBirthInFuture("2024-06-15")).toBe(false);
  });
});
