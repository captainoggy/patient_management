from django.conf import settings
from django.db import models

from clinics.models import Clinic


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.PROTECT,
        related_name="staff_users",
    )

    class Meta:
        indexes = [
            models.Index(fields=("clinic",)),
        ]

    def __str__(self) -> str:
        return f"{self.user.get_username()} → {self.clinic}"
