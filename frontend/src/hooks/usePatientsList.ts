import { useCallback, useEffect, useState } from "react";

import { listPatients, type Patient } from "../api/patients";

const PAGE_SIZE = 20;

export function usePatientsList(clinicId: number) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [listCount, setListCount] = useState(0);
  const [page, setPage] = useState(1);
  const [listNext, setListNext] = useState<string | null>(null);
  const [listPrevious, setListPrevious] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await listPatients(page, PAGE_SIZE, clinicId);
      setPatients(data.results);
      setListCount(data.count);
      setListNext(data.next);
      setListPrevious(data.previous);
    } catch {
      setError("Could not load patients.");
    } finally {
      setLoading(false);
    }
  }, [clinicId, page]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    patients,
    listCount,
    page,
    setPage,
    listNext,
    listPrevious,
    loading,
    error,
    setError,
    reload,
  };
}
