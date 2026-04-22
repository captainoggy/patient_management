from django.contrib import admin

from appointments.models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("patient", "scheduled_at")
    list_filter = ("scheduled_at",)
    search_fields = ("patient__first_name", "patient__last_name", "notes")
    filter_horizontal = ("clinicians",)
