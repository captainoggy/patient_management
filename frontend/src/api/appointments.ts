import { apiFetch } from "./http";

import type { Clinician } from "./clinicians";
import type { Paginated } from "./types";

export type Appointment = {
  id: number;
  patient: number;
  patient_first_name: string;
  patient_last_name: string;
  scheduled_at: string;
  notes: string;
  clinicians: Clinician[];
};

export async function listAppointments(clinicId: number): Promise<Appointment[]> {
  const q = new URLSearchParams({
    clinic_id: String(clinicId),
    page_size: "100",
  });
  const data = await apiFetch<Paginated<Appointment>>(`/v1/appointments/?${q.toString()}`);
  return data.results;
}

export type AppointmentWritePayload = {
  patient?: number;
  scheduled_at: string;
  notes?: string;
  clinician_ids?: number[];
};

export async function createAppointment(
  body: AppointmentWritePayload & { patient: number },
): Promise<Appointment> {
  return apiFetch<Appointment>("/v1/appointments/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAppointment(
  id: number,
  body: Partial<AppointmentWritePayload>,
): Promise<Appointment> {
  return apiFetch<Appointment>(`/v1/appointments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteAppointment(id: number): Promise<void> {
  await apiFetch<unknown>(`/v1/appointments/${id}/`, { method: "DELETE" });
}
