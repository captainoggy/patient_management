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

    def get_appointment_count(self, obj: Patient) -> int:
        if hasattr(obj, "appointment_count"):
            return int(obj.appointment_count)
        return obj.appointments.count()
