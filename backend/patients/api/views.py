from django.db.models import Count
from rest_framework import viewsets

from accounts.permissions import HasClinicProfile
from patients.api.serializers import PatientSerializer
from patients.models import Patient


class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [HasClinicProfile]
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]

    def get_queryset(self):
        clinic_id = self.request.user.profile.clinic_id
        return (
            Patient.objects.filter(clinic_id=clinic_id)
            .annotate(appointment_count=Count("appointments"))
            .order_by("last_name", "first_name")
        )

    def perform_create(self, serializer):
        serializer.save(clinic_id=self.request.user.profile.clinic_id)
