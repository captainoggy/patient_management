from django.db import models


class Clinic(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=64, unique=True, db_index=True)

    class Meta:
        ordering = ("name",)

    def __str__(self) -> str:
        return self.name
