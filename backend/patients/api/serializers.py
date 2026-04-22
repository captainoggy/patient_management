from django.utils import timezone
from rest_framework import serializers

from patients.models import Patient


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
        if value is not None and value > timezone.now().date():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value

    def get_appointment_count(self, obj: Patient) -> int:
        if hasattr(obj, "appointment_count"):
            return int(obj.appointment_count)
        return obj.appointments.count()
