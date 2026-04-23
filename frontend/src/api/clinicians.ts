import { apiFetch } from "./http";

import type { Paginated } from "./types";

export type Clinician = {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  email: string;
};

export async function listClinicians(clinicId: number): Promise<Clinician[]> {
  const q = new URLSearchParams({
    clinic_id: String(clinicId),
    page_size: "100",
  });
  const data = await apiFetch<Paginated<Clinician>>(`/v1/clinicians/?${q.toString()}`);
  return data.results;
}
