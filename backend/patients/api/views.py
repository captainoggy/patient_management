from django.db.models import Count
from rest_framework import viewsets

from accounts.permissions import HasPatientClinicAccess
from patients.api.serializers import PatientSerializer
from patients.models import Patient
from patients.scoping import resolve_clinic_id


class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [HasPatientClinicAccess]
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        request.resolved_clinic_id = resolve_clinic_id(request)

    def get_queryset(self):
        clinic_id = self.request.resolved_clinic_id
        return (
            Patient.objects.filter(clinic_id=clinic_id)
            .annotate(appointment_count=Count("appointments"))
            .order_by("last_name", "first_name")
        )

    def perform_create(self, serializer):
        serializer.save(clinic_id=self.request.resolved_clinic_id)
