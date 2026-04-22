from django.contrib import admin

from clinicians.models import Clinician


@admin.register(Clinician)
class ClinicianAdmin(admin.ModelAdmin):
    list_display = ("last_name", "first_name", "clinic", "role")
    list_filter = ("clinic",)
    search_fields = ("first_name", "last_name", "email")
