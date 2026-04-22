/** Page numbers and ellipsis markers for compact pagination UI. */
export type PageItem = number | "ellipsis";

/** Classic sliding window with ellipses (e.g. 1 … 4 5 6 … 20). */
export function visiblePageItems(current: number, total: number, delta = 2): PageItem[] {
  if (total < 1) return [];
  const range: number[] = [];
  const left = current - delta;
  const right = current + delta + 1;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= left && i < right)) {
      range.push(i);
    }
  }

  const out: PageItem[] = [];
  let prev = 0;
  for (const i of range) {
    if (prev) {
      if (i - prev === 2) {
        out.push(prev + 1);
      } else if (i - prev !== 1) {
        out.push("ellipsis");
      }
    }
    out.push(i);
    prev = i;
  }
  return out;
}

export function readPageQuery(): number {
  if (typeof window === "undefined") return 1;
  const raw = new URLSearchParams(window.location.search).get("page");
  const n = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export function writePageQuery(page: number, replace: boolean): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (page <= 1) {
    url.searchParams.delete("page");
  } else {
    url.searchParams.set("page", String(page));
  }
  const qs = url.searchParams.toString();
  const path = qs ? `${url.pathname}?${qs}` : url.pathname;
  if (replace) {
    window.history.replaceState({ page }, "", path);
  } else {
    window.history.pushState({ page }, "", path);
  }
}
