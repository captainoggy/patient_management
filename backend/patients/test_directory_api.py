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


class DirectoryApiTests(TestCase):
    def setUp(self):
        self.clinic = Clinic.objects.create(name="Dir Clinic", slug="dir-clinic")
        self.user = User.objects.create_user(username="dir_staff", password="pass12345")
        UserProfile.objects.create(user=self.user, clinic=self.clinic)
        self.clinician = Clinician.objects.create(
            clinic=self.clinic,
            first_name="Jamie",
            last_name="Rivera",
            role="Physician",
            email="j@example.com",
        )
        self.patient = Patient.objects.create(
            clinic=self.clinic,
            first_name="Alex",
            last_name="Nguyen",
        )
        self.appt = Appointment.objects.create(
            patient=self.patient,
            scheduled_at=timezone.now(),
            notes="Demo visit",
        )
        self.appt.clinicians.add(self.clinician)
        self.client = APIClient(enforce_csrf_checks=False)

    def test_clinicians_list_scoped_to_clinic(self):
        self.client.force_login(self.user)
        r = self.client.get(f"/api/v1/clinicians/?clinic_id={self.clinic.id}")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["count"], 1)
        self.assertEqual(r.data["results"][0]["last_name"], "Rivera")

    def test_appointments_list_includes_patient_and_clinicians(self):
        self.client.force_login(self.user)
        r = self.client.get(f"/api/v1/appointments/?clinic_id={self.clinic.id}")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["count"], 1)
        row = r.data["results"][0]
        self.assertEqual(row["patient"], self.patient.id)
        self.assertEqual(row["patient_last_name"], "Nguyen")
        self.assertEqual(len(row["clinicians"]), 1)
        self.assertEqual(row["clinicians"][0]["last_name"], "Rivera")
