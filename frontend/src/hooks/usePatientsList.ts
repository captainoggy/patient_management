import { useCallback, useEffect, useState } from "react";

import { listPatients, type Patient } from "../api/patients";
import { readPageQuery, writePageQuery } from "../utils/patientPagination";

const PAGE_SIZE = 20;

export function usePatientsList(clinicId: number) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [listCount, setListCount] = useState(0);
  const [page, setPageState] = useState(readPageQuery);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setPageReplaceUrl = useCallback((n: number) => {
    const v = Math.max(1, Math.floor(n));
    setPageState(v);
    writePageQuery(v, true);
  }, []);

  const goToPage = useCallback((n: number) => {
    const v = Math.max(1, Math.floor(n));
    setPageState((prev) => {
      if (prev !== v) {
        writePageQuery(v, false);
      }
      return v;
    });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setPageState(readPageQuery());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const reload = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await listPatients(page, PAGE_SIZE, clinicId);
      setPatients(data.results);
      setListCount(data.count);
    } catch {
      setError("Could not load patients.");
    } finally {
      setLoading(false);
    }
  }, [clinicId, page]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const totalPages =
    listCount > 0 ? Math.max(1, Math.ceil(listCount / PAGE_SIZE)) : 0;

  useEffect(() => {
    if (loading || totalPages === 0) return;
    if (page > totalPages) {
      setPageReplaceUrl(totalPages);
    }
  }, [loading, totalPages, page, setPageReplaceUrl]);

  return {
    patients,
    listCount,
    page,
    goToPage,
    totalPages,
    loading,
    error,
    setError,
    reload,
  };
}
