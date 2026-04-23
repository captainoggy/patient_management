from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import UserProfile
from appointments.models import Appointment
from clinicians.models import Clinician
from clinics.models import Clinic
from patients.models import Patient


class AppointmentWriteApiTests(TestCase):
    def setUp(self):
        self.clinic = Clinic.objects.create(name="Clinic A", slug="clinic-a")
        self.other_clinic = Clinic.objects.create(name="Clinic B", slug="clinic-b")
        self.user = User.objects.create_user(username="staff", password="pass12345")
        UserProfile.objects.create(user=self.user, clinic=self.clinic)
        self.patient = Patient.objects.create(
            clinic=self.clinic,
            first_name="Pat",
            last_name="One",
        )
        self.patient_two = Patient.objects.create(
            clinic=self.clinic,
            first_name="Pat",
            last_name="Two",
        )
        self.other_patient = Patient.objects.create(
            clinic=self.other_clinic,
            first_name="Pat",
            last_name="Other",
        )
        self.doc = Clinician.objects.create(
            clinic=self.clinic,
            first_name="Jamie",
            last_name="Rivera",
            role="Physician",
            email="j@example.com",
        )
        self.other_doc = Clinician.objects.create(
            clinic=self.other_clinic,
            first_name="X",
            last_name="Y",
            role="Physician",
            email="xy@example.com",
        )
        self.client = APIClient(enforce_csrf_checks=False)

    def test_create_appointment_with_clinicians(self):
        self.client.force_login(self.user)
        when = timezone.now()
        r = self.client.post(
            "/api/v1/appointments/",
            {
                "patient": self.patient.id,
                "scheduled_at": when.isoformat(),
                "notes": "Check-up",
                "clinician_ids": [self.doc.id],
            },
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data["notes"], "Check-up")
        self.assertEqual(len(r.data["clinicians"]), 1)
        self.assertEqual(r.data["clinicians"][0]["last_name"], "Rivera")

    def test_create_rejects_other_clinic_patient(self):
        self.client.force_login(self.user)
        r = self.client.post(
            "/api/v1/appointments/",
            {
                "patient": self.other_patient.id,
                "scheduled_at": timezone.now().isoformat(),
                "notes": "Bad",
                "clinician_ids": [],
            },
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_rejects_other_clinic_clinician(self):
        self.client.force_login(self.user)
        r = self.client.post(
            "/api/v1/appointments/",
            {
                "patient": self.patient.id,
                "scheduled_at": timezone.now().isoformat(),
                "notes": "Bad",
                "clinician_ids": [self.other_doc.id],
            },
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_updates_clinicians(self):
        self.client.force_login(self.user)
        appt = Appointment.objects.create(
            patient=self.patient,
            scheduled_at=timezone.now(),
            notes="Old",
        )
        appt.clinicians.add(self.doc)
        r = self.client.patch(
            f"/api/v1/appointments/{appt.id}/",
            {"notes": "New note", "clinician_ids": []},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["notes"], "New note")
        self.assertEqual(r.data["clinicians"], [])

    def test_delete_appointment(self):
        self.client.force_login(self.user)
        appt = Appointment.objects.create(
            patient=self.patient,
            scheduled_at=timezone.now(),
            notes="Gone",
        )
        r = self.client.delete(f"/api/v1/appointments/{appt.id}/")
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Appointment.objects.filter(id=appt.id).exists())

    def test_rejects_second_visit_same_patient_same_time(self):
        self.client.force_login(self.user)
        when = timezone.now()
        Appointment.objects.create(patient=self.patient, scheduled_at=when, notes="First")
        r = self.client.post(
            "/api/v1/appointments/",
            {
                "patient": self.patient.id,
                "scheduled_at": when.isoformat(),
                "notes": "Duplicate slot",
                "clinician_ids": [],
            },
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        # Serializer may flag `scheduled_at` or the model's unique constraint may surface as
        # `non_field_errors` depending on validation order and datetime normalization.
        self.assertTrue(
            "scheduled_at" in r.data
            or (r.data.get("non_field_errors") and "unique" in str(r.data).lower())
        )

    def test_rejects_clinician_double_booked_same_time_different_patient(self):
        self.client.force_login(self.user)
        when = timezone.now()
        first = Appointment.objects.create(
            patient=self.patient,
            scheduled_at=when,
            notes="First",
        )
        first.clinicians.add(self.doc)
        r = self.client.post(
            "/api/v1/appointments/",
            {
                "patient": self.patient_two.id,
                "scheduled_at": when.isoformat(),
                "notes": "Clash",
                "clinician_ids": [self.doc.id],
            },
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("scheduled_at", r.data)
