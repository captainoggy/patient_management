from django.db import models

from clinicians.models import Clinician
from patients.models import Patient


class Appointment(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="appointments",
    )
    clinicians = models.ManyToManyField(
        Clinician,
        related_name="appointments",
        blank=True,
    )
    scheduled_at = models.DateTimeField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-scheduled_at",)
        indexes = [
            models.Index(fields=("patient", "scheduled_at")),
        ]

    def __str__(self) -> str:
        return f"{self.patient} @ {self.scheduled_at.isoformat()}"
