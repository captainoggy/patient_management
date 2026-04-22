from django.db import models

from clinics.models import Clinic


class Clinician(models.Model):
    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.CASCADE,
        related_name="clinicians",
    )
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    role = models.CharField(max_length=120, blank=True)
    email = models.EmailField(blank=True)

    class Meta:
        ordering = ("last_name", "first_name")
        indexes = [
            models.Index(fields=("clinic", "last_name")),
        ]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}"
