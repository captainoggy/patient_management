from rest_framework import serializers

from clinicians.models import Clinician


class ClinicianSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clinician
        fields = ("id", "first_name", "last_name", "role", "email")
