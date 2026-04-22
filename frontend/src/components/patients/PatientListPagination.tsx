import type { ReactNode } from "react";

import { PAGE_SIZE_OPTIONS, visiblePageItems } from "../../utils/patientPagination";
import type { PageSizeOption } from "../../utils/patientPagination";

type Props = {
  listCount: number;
  page: number;
  totalPages: number;
  pageSize: PageSizeOption;
  rangeStart: number;
  rangeEnd: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSizeOption) => void;
};

function PagerSvg({ children }: { children: ReactNode }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      {children}
    </svg>
  );
}

export function PatientListPagination({
  listCount,
  page,
  totalPages,
  pageSize,
  rangeStart,
  rangeEnd,
  onPageChange,
  onPageSizeChange,
}: Props) {
  if (listCount <= 0) return null;

  const items = totalPages <= 1 ? ([1] as const) : visiblePageItems(page, totalPages);
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <div className="pager-bar">
      <div className="pager-left">
        <label className="pager-rows">
          <span className="pager-rows-label">Rows per page</span>
          <select
            className="pager-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSizeOption)}
            aria-label="Rows per page"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="pager-range">
          {rangeStart}–{rangeEnd} of {listCount}
        </span>
      </div>

      <nav className="pager-right" aria-label="Pagination">
        <div className="pager-icon-group">
          <button
            type="button"
            className="pager-icon-btn"
            disabled={isFirst}
            aria-label="First page"
            onClick={() => onPageChange(1)}
          >
            <PagerSvg>
              <path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6 1.41-1.41zM12 6l-1.41 1.41L16.18 12l-5.59 5.59L12 18l6-6-6-6z" />
            </PagerSvg>
          </button>
          <button
            type="button"
            className="pager-icon-btn"
            disabled={isFirst}
            aria-label="Previous page"
            onClick={() => onPageChange(page - 1)}
          >
            <PagerSvg>
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </PagerSvg>
          </button>
        </div>

        <ul className="pager-page-list">
          {items.map((item, idx) =>
            item === "ellipsis" ? (
              <li key={`e-${idx}`} className="pager-ellipsis" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={item}>
                {item === page ? (
                  <span className="pager-num pager-num-current" aria-current="page">
                    {item}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="pager-num pager-num-btn"
                    onClick={() => onPageChange(item)}
                  >
                    {item}
                  </button>
                )}
              </li>
            ),
          )}
        </ul>

        <div className="pager-icon-group">
          <button
            type="button"
            className="pager-icon-btn"
            disabled={isLast}
            aria-label="Next page"
            onClick={() => onPageChange(page + 1)}
          >
            <PagerSvg>
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </PagerSvg>
          </button>
          <button
            type="button"
            className="pager-icon-btn"
            disabled={isLast}
            aria-label="Last page"
            onClick={() => onPageChange(totalPages)}
          >
            <PagerSvg>
              <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6-1.41 1.41zM16 6h2v12h-2z" />
            </PagerSvg>
          </button>
        </div>
      </nav>
    </div>
  );
}
