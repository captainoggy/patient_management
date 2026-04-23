from datetime import date, timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import UserProfile
from appointments.models import Appointment
from clinicians.models import Clinician
from clinics.models import Clinic
from patients.models import Patient

CLINICIANS = (
    ("Jamie", "Rivera", "Physician", "jamie@example.com"),
    ("Sam", "Okonkwo", "Nurse Practitioner", "sam@example.com"),
    ("Riley", "Chen", "Physician", "riley@example.com"),
    ("Morgan", "Patel", "Physician Assistant", "morgan@example.com"),
    ("Harper", "Li", "Clinical Pharmacist", "harper.li@example.com"),
    ("Dev", "Santos", "Behavioral Health", "dev.santos@example.com"),
)

# first_name, last_name, date_of_birth, email, phone
PATIENTS = (
    ("Alex", "Nguyen", date(1992, 4, 12), "alex@example.com", "555-0100"),
    ("Jordan", "Kim", date(1988, 11, 3), "jordan.kim@example.com", "555-0101"),
    ("Taylor", "Brooks", None, "taylor.b@example.com", "555-0102"),
    ("Casey", "Martinez", date(1975, 7, 22), "casey.m@example.com", "555-0103"),
    ("Riley", "Thompson", date(2001, 1, 9), "riley.t@example.com", "555-0104"),
    ("Quinn", "Singh", date(1995, 9, 30), "quinn.s@example.com", "555-0105"),
    ("Avery", "Dubois", date(1963, 5, 18), "avery.d@example.com", "555-0106"),
    ("Skyler", "Hernandez", None, "skyler.h@example.com", "555-0107"),
    ("Dakota", "Okafor", date(1999, 12, 1), "dakota.o@example.com", "555-0108"),
    ("Reese", "Nakamura", date(1983, 2, 27), "reese.n@example.com", "555-0109"),
)

# patient (first, last), notes key, day offset, clinician last names; negative = past
APPOINTMENTS = (
    ("Alex", "Nguyen", "[demo] Follow-up visit", 1, ("Rivera",)),
    ("Jordan", "Kim", "[demo] Annual physical", 3, ("Chen", "Okonkwo")),
    ("Taylor", "Brooks", "[demo] New patient intake", 5, ("Patel",)),
    ("Casey", "Martinez", "[demo] Lab review", 7, ("Rivera", "Patel")),
    ("Riley", "Thompson", "[demo] Sports clearance", 10, ("Chen",)),
    ("Quinn", "Singh", "[demo] Vaccination", 14, ("Okonkwo",)),
    ("Avery", "Dubois", "[demo] Chronic care check-in", 2, ("Rivera", "Chen")),
    ("Skyler", "Hernandez", "[demo] Telehealth consult", 4, ("Patel",)),
    ("Dakota", "Okafor", "[demo] Mental health intake", 8, ("Okonkwo", "Patel", "Santos")),
    ("Reese", "Nakamura", "[demo] Post-op follow-up", 12, ("Chen", "Rivera")),
    ("Alex", "Nguyen", "[demo] Vaccine booster", 21, ("Okonkwo",)),
    # Past visits (history on the schedule)
    ("Alex", "Nguyen", "[demo] Initial consult (past)", -45, ("Rivera", "Patel")),
    ("Jordan", "Kim", "[demo] Sick visit (past)", -12, ("Okonkwo",)),
    ("Taylor", "Brooks", "[demo] Triage call (past)", -3, ("Chen",)),
    ("Casey", "Martinez", "[demo] Medication review (past)", -60, ("Li", "Rivera")),
    ("Riley", "Thompson", "[demo] Injury check (past)", -21, ("Chen", "Okonkwo")),
    # Extra upcoming variety
    ("Quinn", "Singh", "[demo] Travel clinic consult", 18, ("Patel", "Li")),
    ("Avery", "Dubois", "[demo] Diabetes education", 6, ("Okonkwo", "Li")),
    ("Skyler", "Hernandez", "[demo] Care coordination", 9, ("Santos", "Patel")),
    ("Dakota", "Okafor", "[demo] Follow-up counseling", 11, ("Santos",)),
    ("Reese", "Nakamura", "[demo] Imaging results", 16, ("Rivera", "Chen")),
    # Unassigned staff — UI shows em dash in Clinicians column
    ("Jordan", "Kim", "[demo] Admin block (staff TBD)", 20, ()),
)


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

        clinicians_by_last: dict[str, Clinician] = {}
        for first, last, role, email in CLINICIANS:
            c, _ = Clinician.objects.get_or_create(
                clinic=clinic,
                first_name=first,
                last_name=last,
                defaults={"role": role, "email": email},
            )
            clinicians_by_last[last] = c

        for first, last, dob, email, phone in PATIENTS:
            patient, _ = Patient.objects.get_or_create(
                clinic=clinic,
                first_name=first,
                last_name=last,
                defaults={
                    "date_of_birth": dob,
                    "email": email,
                    "phone": phone,
                },
            )
            # Backfill fields if patient existed from an older seed with sparse defaults
            updates = []
            if patient.date_of_birth != dob and dob is not None:
                patient.date_of_birth = dob
                updates.append("date_of_birth")
            if email and patient.email != email:
                patient.email = email
                updates.append("email")
            if phone and patient.phone != phone:
                patient.phone = phone
                updates.append("phone")
            if updates:
                patient.save(update_fields=updates)

        for p_first, p_last, notes, day_offset, clinician_lasts in APPOINTMENTS:
            patient = Patient.objects.get(
                clinic=clinic,
                first_name=p_first,
                last_name=p_last,
            )
            appt, _ = Appointment.objects.get_or_create(
                patient=patient,
                notes=notes,
                defaults={
                    "scheduled_at": timezone.now() + timedelta(days=day_offset),
                },
            )
            for ln in clinician_lasts:
                appt.clinicians.add(clinicians_by_last[ln])

        self.stdout.write(self.style.SUCCESS("Demo data ready (user demo / demo12345)."))
