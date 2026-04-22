import { visiblePageItems } from "../../utils/patientPagination";

type Props = {
  listCount: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function PatientListPagination({ listCount, page, totalPages, onPageChange }: Props) {
  if (listCount <= 0) return null;

  const items = totalPages <= 1 ? [1] as const : visiblePageItems(page, totalPages);

  return (
    <div className="pager">
      <p className="pager-info">
        <strong>{listCount}</strong> patient{listCount === 1 ? "" : "s"} · page{" "}
        <strong>
          {page} of {totalPages}
        </strong>
      </p>
      <nav className="pager-pages" aria-label="Pagination">
        <ul className="pager-page-list">
          {items.map((item, idx) =>
            item === "ellipsis" ? (
              <li key={`e-${idx}`} className="pager-ellipsis" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  className={
                    item === page ? "btn btn-primary btn-sm pager-num is-active" : "btn btn-secondary btn-sm pager-num"
                  }
                  aria-current={item === page ? "page" : undefined}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </button>
              </li>
            ),
          )}
        </ul>
      </nav>
    </div>
  );
}
