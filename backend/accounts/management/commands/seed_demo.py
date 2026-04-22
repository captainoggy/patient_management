from datetime import timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import UserProfile
from appointments.models import Appointment
from clinicians.models import Clinician
from clinics.models import Clinic
from patients.models import Patient


class Command(BaseCommand):
    help = "Create idempotent demo clinic, staff user, and sample records."

    def handle(self, *args, **options):
        clinic, _ = Clinic.objects.get_or_create(
            slug="demo-clinic",
            defaults={"name": "Demo Clinic"},
        )

        user, created = User.objects.get_or_create(
            username="demo",
            defaults={"email": "demo@example.com"},
        )
        if created or not user.has_usable_password():
            user.set_password("demo12345")
            user.save()

        profile, pc = UserProfile.objects.get_or_create(
            user=user,
            defaults={"clinic": clinic},
        )
        if not pc and profile.clinic_id != clinic.id:
            profile.clinic = clinic
            profile.save(update_fields=["clinic"])

        clinician, _ = Clinician.objects.get_or_create(
            clinic=clinic,
            first_name="Jamie",
            last_name="Rivera",
            defaults={"role": "Physician", "email": "jamie@example.com"},
        )

        patient, _ = Patient.objects.get_or_create(
            clinic=clinic,
            first_name="Alex",
            last_name="Nguyen",
            defaults={
                "email": "alex@example.com",
                "phone": "555-0100",
            },
        )

        if not Appointment.objects.filter(patient=patient).exists():
            appt = Appointment.objects.create(
                patient=patient,
                scheduled_at=timezone.now() + timedelta(days=1),
                notes="Follow-up",
            )
            appt.clinicians.add(clinician)

        self.stdout.write(self.style.SUCCESS("Demo data ready (user demo / demo12345)."))
