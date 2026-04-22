type Props = {
  listCount: number;
  page: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function PatientListPagination({
  listCount,
  page,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: Props) {
  if (listCount <= 0) return null;

  return (
    <div className="row-between" style={{ marginTop: "1rem" }}>
      <p className="muted" style={{ margin: 0 }}>
        {listCount} patient{listCount === 1 ? "" : "s"} total · page {page}
      </p>
      <div className="row">
        <button type="button" className="btn btn-ghost" disabled={!hasPrevious} onClick={onPrevious}>
          Previous
        </button>
        <button type="button" className="btn btn-ghost" disabled={!hasNext} onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
}
