import { useCallback, useEffect, useState } from "react";

import { listPatients, type Patient } from "../api/patients";
import {
  readPageQuery,
  readPageSizeQuery,
  writePaginationQuery,
  clampPageSize,
  type PageSizeOption,
} from "../utils/patientPagination";

type ListQuery = { page: number; pageSize: PageSizeOption };

function readListQuery(): ListQuery {
  return { page: readPageQuery(), pageSize: readPageSizeQuery() };
}

export function usePatientsList(clinicId: number) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [listCount, setListCount] = useState(0);
  const [query, setQuery] = useState<ListQuery>(readListQuery);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { page, pageSize } = query;

  const goToPage = useCallback(
    (n: number) => {
      const v = Math.max(1, Math.floor(n));
      setQuery((q) => {
        if (q.page !== v) {
          writePaginationQuery(v, q.pageSize, false);
          return { ...q, page: v };
        }
        return q;
      });
    },
    [],
  );

  const setPageSize = useCallback((size: number) => {
    const ps = clampPageSize(size);
    writePaginationQuery(1, ps, false);
    setQuery({ page: 1, pageSize: ps });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setQuery(readListQuery());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const reload = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await listPatients(page, pageSize, clinicId);
      setPatients(data.results);
      setListCount(data.count);
    } catch {
      setError("Could not load patients.");
    } finally {
      setLoading(false);
    }
  }, [clinicId, page, pageSize]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const totalPages =
    listCount > 0 ? Math.max(1, Math.ceil(listCount / pageSize)) : 0;

  useEffect(() => {
    if (loading || totalPages === 0) return;
    if (page > totalPages) {
      setQuery((q) => {
        const p = totalPages;
        writePaginationQuery(p, q.pageSize, true);
        return { ...q, page: p };
      });
    }
  }, [loading, totalPages, page]);

  const rangeStart = listCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = listCount === 0 ? 0 : Math.min(page * pageSize, listCount);

  return {
    patients,
    listCount,
    page,
    pageSize,
    goToPage,
    setPageSize,
    totalPages,
    rangeStart,
    rangeEnd,
    loading,
    error,
    setError,
    reload,
  };
}
