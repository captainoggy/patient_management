import { apiFetch } from "./http";

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

export type PatientPayload = {
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  email?: string;
  phone?: string;
};

export async function listPatients(): Promise<Patient[]> {
  return apiFetch<Patient[]>("/v1/patients/");
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
