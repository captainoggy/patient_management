/** Page numbers and ellipsis markers for compact pagination UI. */
export type PageItem = number | "ellipsis";

export const DEFAULT_PAGE_SIZE = 10;

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export function clampPageSize(n: number): PageSizeOption {
  if ((PAGE_SIZE_OPTIONS as readonly number[]).includes(n)) {
    return n as PageSizeOption;
  }
  return DEFAULT_PAGE_SIZE;
}

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

export function readPageSizeQuery(): PageSizeOption {
  if (typeof window === "undefined") return DEFAULT_PAGE_SIZE;
  const raw = new URLSearchParams(window.location.search).get("page_size");
  if (!raw) return DEFAULT_PAGE_SIZE;
  const n = Number.parseInt(raw, 10);
  return clampPageSize(n);
}

/** Sync ?page= and ?page_size= (omits params when equal to defaults). */
export function writePaginationQuery(page: number, pageSize: number, replace: boolean): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (page <= 1) {
    url.searchParams.delete("page");
  } else {
    url.searchParams.set("page", String(page));
  }
  if (pageSize <= DEFAULT_PAGE_SIZE) {
    url.searchParams.delete("page_size");
  } else {
    url.searchParams.set("page_size", String(pageSize));
  }
  const qs = url.searchParams.toString();
  const path = qs ? `${url.pathname}?${qs}` : url.pathname;
  if (replace) {
    window.history.replaceState({ page, pageSize }, "", path);
  } else {
    window.history.pushState({ page, pageSize }, "", path);
  }
}
