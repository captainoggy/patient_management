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


class PatientApiTests(TestCase):
    def setUp(self):
        self.clinic = Clinic.objects.create(name="Test Clinic", slug="test-clinic")
        self.other_clinic = Clinic.objects.create(name="Other", slug="other")
        self.user = User.objects.create_user(username="staff", password="pass12345")
        UserProfile.objects.create(user=self.user, clinic=self.clinic)
        Patient.objects.create(
            clinic=self.clinic,
            first_name="Pat",
            last_name="One",
        )
        Patient.objects.create(
            clinic=self.other_clinic,
            first_name="Pat",
            last_name="Other",
        )
        self.client = APIClient(enforce_csrf_checks=False)
        self.other_patient = Patient.objects.get(clinic=self.other_clinic, last_name="Other")

    def test_anonymous_cannot_access_patients(self):
        r = self.client.get("/api/v1/patients/")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_without_profile_cannot_access_patients(self):
        lone = User.objects.create_user(username="noprofile", password="pass12345")
        self.client.force_login(lone)
        r = self.client.get("/api/v1/patients/")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_retrieve_other_clinic_patient(self):
        self.client.force_login(self.user)
        r = self.client.get(f"/api/v1/patients/{self.other_patient.id}/")
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_scoped_to_clinic(self):
        self.client.force_login(self.user)
        r = self.client.get("/api/v1/patients/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn("results", r.data)
        self.assertEqual(len(r.data["results"]), 1)
        self.assertEqual(r.data["results"][0]["last_name"], "One")
        self.assertEqual(r.data["count"], 1)

    def test_list_explicit_clinic_id_query(self):
        self.client.force_login(self.user)
        r = self.client.get(f"/api/v1/patients/?clinic_id={self.clinic.id}")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["count"], 1)

    def test_list_wrong_clinic_forbidden(self):
        self.client.force_login(self.user)
        r = self.client.get(f"/api/v1/patients/?clinic_id={self.other_clinic.id}")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_excludes_nested_appointments(self):
        self.client.force_login(self.user)
        r = self.client.get(f"/api/v1/patients/?clinic_id={self.clinic.id}")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertNotIn("appointments", r.data["results"][0])

    def test_retrieve_includes_nested_appointments_and_clinicians(self):
        self.client.force_login(self.user)
        p = Patient.objects.get(clinic=self.clinic, last_name="One")
        doc = Clinician.objects.create(
            clinic=self.clinic,
            first_name="Jamie",
            last_name="Rivera",
            role="Physician",
            email="jr@example.com",
        )
        appt = Appointment.objects.create(
            patient=p,
            scheduled_at=timezone.now(),
            notes="Demo visit",
        )
        appt.clinicians.add(doc)
        r = self.client.get(f"/api/v1/patients/{p.id}/?clinic_id={self.clinic.id}")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn("appointments", r.data)
        self.assertEqual(len(r.data["appointments"]), 1)
        self.assertEqual(r.data["appointments"][0]["notes"], "Demo visit")
        self.assertEqual(len(r.data["appointments"][0]["clinicians"]), 1)
        self.assertEqual(r.data["appointments"][0]["clinicians"][0]["last_name"], "Rivera")

    def test_create_patient(self):
        self.client.force_login(self.user)
        r = self.client.post(
            "/api/v1/patients/",
            {
                "first_name": "New",
                "last_name": "Patient",
                "email": "n@example.com",
            },
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data["first_name"], "New")
        p = Patient.objects.get(id=r.data["id"])
        self.assertEqual(p.clinic_id, self.clinic.id)

    def test_create_patient_allows_todays_dob_with_client_calendar_header(self):
        self.client.force_login(self.user)
        today = timezone.localdate().isoformat()
        r = self.client.post(
            "/api/v1/patients/",
            {
                "first_name": "Today",
                "last_name": "Baby",
                "date_of_birth": today,
            },
            format="json",
            HTTP_X_CLIENT_CALENDAR_DATE=today,
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data["date_of_birth"], today)

    def test_validation_rejects_future_dob(self):
        self.client.force_login(self.user)
        r = self.client.post(
            "/api/v1/patients/",
            {
                "first_name": "A",
                "last_name": "B",
                "date_of_birth": "2099-01-01",
            },
            format="json",
            HTTP_X_CLIENT_CALENDAR_DATE=timezone.localdate().isoformat(),
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_superuser_requires_clinic_scope(self):
        admin = User.objects.create_superuser(username="admin", password="admin12345")
        self.client.force_login(admin)
        r = self.client.get("/api/v1/patients/")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_superuser_with_header_lists_clinic(self):
        admin = User.objects.create_superuser(username="admin2", password="admin12345")
        self.client.force_login(admin)
        r = self.client.get(
            "/api/v1/patients/",
            HTTP_X_CLINIC_ID=str(self.clinic.id),
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["count"], 1)


class FixedClinicIdTests(TestCase):
    def test_fixed_clinic_allows_matching_staff(self):
        clinic = Clinic.objects.create(name="Only", slug="only")
        with self.settings(FIXED_CLINIC_ID=clinic.id):
            user = User.objects.create_user(username="u1", password="p")
            UserProfile.objects.create(user=user, clinic=clinic)
            client = APIClient(enforce_csrf_checks=False)
            client.force_login(user)
            r = client.get("/api/v1/patients/")
            self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_fixed_clinic_rejects_other_clinic_staff(self):
        c1 = Clinic.objects.create(name="A", slug="a")
        c2 = Clinic.objects.create(name="B", slug="b")
        with self.settings(FIXED_CLINIC_ID=c1.id):
            user = User.objects.create_user(username="u2", password="p")
            UserProfile.objects.create(user=user, clinic=c2)
            client = APIClient(enforce_csrf_checks=False)
            client.force_login(user)
            r = client.get("/api/v1/patients/")
            self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_fixed_clinic_invalid_id_returns_400(self):
        with self.settings(FIXED_CLINIC_ID=999_999):
            clinic = Clinic.objects.create(name="A", slug="a")
            user = User.objects.create_user(username="u3", password="p")
            UserProfile.objects.create(user=user, clinic=clinic)
            client = APIClient(enforce_csrf_checks=False)
            client.force_login(user)
            r = client.get("/api/v1/patients/")
            self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
