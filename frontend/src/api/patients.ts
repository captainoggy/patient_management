import { apiFetch } from "./http";

import type { Clinician } from "./clinicians";

export type Patient = {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  email: string;
  phone: string;
  appointment_count: number;
  created_at: string;
  updated_at: string;
};

export type PatientAppointment = {
  id: number;
  scheduled_at: string;
  notes: string;
  clinicians: Clinician[];
};

export type PatientDetail = Patient & {
  appointments: PatientAppointment[];
};

export type PatientPayload = {
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  email?: string;
  phone?: string;
};

export type PaginatedPatients = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Patient[];
};

export async function fetchPatientDetail(id: number, clinicId: number): Promise<PatientDetail> {
  const q = new URLSearchParams({ clinic_id: String(clinicId) });
  return apiFetch<PatientDetail>(`/v1/patients/${id}/?${q.toString()}`);
}

export async function listPatients(
  page = 1,
  pageSize = 20,
  clinicId?: number,
): Promise<PaginatedPatients> {
  const q = new URLSearchParams();
  q.set("page", String(page));
  q.set("page_size", String(pageSize));
  if (clinicId != null) {
    q.set("clinic_id", String(clinicId));
  }
  return apiFetch<PaginatedPatients>(`/v1/patients/?${q.toString()}`);
}

export async function createPatient(body: PatientPayload): Promise<Patient> {
  return apiFetch<Patient>("/v1/patients/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updatePatient(id: number, body: PatientPayload): Promise<Patient> {
  return apiFetch<Patient>(`/v1/patients/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deletePatient(id: number): Promise<void> {
  await apiFetch<unknown>(`/v1/patients/${id}/`, { method: "DELETE" });
}
