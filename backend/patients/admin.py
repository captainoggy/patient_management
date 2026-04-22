from django.contrib import admin

from appointments.models import Appointment
from patients.models import Patient


class AppointmentInline(admin.TabularInline):
    model = Appointment
    extra = 0
    show_change_link = True
    fields = ("scheduled_at", "notes")


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("last_name", "first_name", "clinic", "email", "phone", "created_at")
    list_filter = ("clinic",)
    search_fields = ("first_name", "last_name", "email", "phone")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "created_at"
    inlines = (AppointmentInline,)
