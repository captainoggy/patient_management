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
        self.assertEqual(len(r.data), 1)
        self.assertEqual(r.data[0]["last_name"], "One")

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
