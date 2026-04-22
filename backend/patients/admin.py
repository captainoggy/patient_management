from django.contrib import admin

from patients.models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("last_name", "first_name", "clinic", "email", "phone")
    list_filter = ("clinic",)
    search_fields = ("first_name", "last_name", "email", "phone")
