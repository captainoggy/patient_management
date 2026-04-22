from datetime import date, timedelta

from django.utils import timezone
from rest_framework import serializers

from patients.models import Patient


def _date_of_birth_upper_bound(request) -> date:
    """
    Latest calendar date allowed as DOB: aligns server UTC "today" with the browser's
    idea of "today" (X-Client-Calendar-Date), capped to at most one day after the
    server's date so spoofed headers cannot open a large future window.
    """
    server_today = timezone.localdate()
    if request is None:
        return server_today
    raw = request.META.get("HTTP_X_CLIENT_CALENDAR_DATE", "").strip()
    if not raw:
        return server_today
    try:
        client_today = date.fromisoformat(raw)
    except ValueError:
        return server_today
    latest = server_today + timedelta(days=1)
    capped = min(client_today, latest)
    return max(server_today, capped)


class PatientSerializer(serializers.ModelSerializer):
    appointment_count = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = (
            "id",
            "first_name",
            "last_name",
            "date_of_birth",
            "email",
            "phone",
            "appointment_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "appointment_count",
            "created_at",
            "updated_at",
        )

    def validate_first_name(self, value: str) -> str:
        v = (value or "").strip()
        if not v:
            raise serializers.ValidationError("This field may not be blank.")
        if len(v) > 120:
            raise serializers.ValidationError("Ensure this field has no more than 120 characters.")
        return v

    def validate_last_name(self, value: str) -> str:
        v = (value or "").strip()
        if not v:
            raise serializers.ValidationError("This field may not be blank.")
        if len(v) > 120:
            raise serializers.ValidationError("Ensure this field has no more than 120 characters.")
        return v

    def validate_phone(self, value: str) -> str:
        if value in (None, ""):
            return ""
        v = value.strip()
        if len(v) > 32:
            raise serializers.ValidationError("Phone must be at most 32 characters.")
        return v

    def validate_date_of_birth(self, value):
        if value is None:
            return value
        request = self.context.get("request")
        if value > _date_of_birth_upper_bound(request):
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value

    def get_appointment_count(self, obj: Patient) -> int:
        if hasattr(obj, "appointment_count"):
            return int(obj.appointment_count)
        return obj.appointments.count()
