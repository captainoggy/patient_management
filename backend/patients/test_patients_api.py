from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import UserProfile
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
