import { ApiError } from "./http";

/** Turn a DRF-style JSON body into a single user-facing message. */
export function messageFromDrfBody(body: unknown): string {
  if (body == null || typeof body !== "object") {
    return "Something went wrong. Try again.";
  }
  const o = body as Record<string, unknown>;

  if (typeof o.detail === "string") {
    return o.detail;
  }
  if (Array.isArray(o.detail)) {
    const parts = o.detail.filter((x): x is string => typeof x === "string");
    if (parts.length) return parts.join(" ");
  }

  const parts: string[] = [];
  for (const [, val] of Object.entries(o)) {
    if (val == null) continue;
    if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === "string") parts.push(item);
      }
    } else if (typeof val === "string") {
      parts.push(val);
    }
  }

  if (parts.length) return parts.join(" ");
  return "Save failed. Check the form and try again.";
}

export function messageFromSaveError(err: unknown): string {
  if (err instanceof ApiError) {
    return messageFromDrfBody(err.body);
  }
  return "Save failed. Try again.";
}
