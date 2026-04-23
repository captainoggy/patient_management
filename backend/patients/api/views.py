from django.db.models import Count, Prefetch
from rest_framework import viewsets

from accounts.permissions import HasPatientClinicAccess
from appointments.models import Appointment
from patients.api.clinic_scope_mixin import ResolveClinicMixin
from patients.api.serializers import PatientDetailSerializer, PatientSerializer
from patients.models import Patient


class PatientViewSet(ResolveClinicMixin, viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [HasPatientClinicAccess]
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PatientDetailSerializer
        return PatientSerializer

    def get_queryset(self):
        clinic_id = self.request.resolved_clinic_id
        qs = (
            Patient.objects.filter(clinic_id=clinic_id)
            .annotate(appointment_count=Count("appointments"))
            .order_by("last_name", "first_name")
        )
        if self.action == "retrieve":
            qs = qs.prefetch_related(
                Prefetch(
                    "appointments",
                    queryset=Appointment.objects.order_by("-scheduled_at").prefetch_related(
                        "clinicians",
                    ),
                ),
            )
        return qs

    def perform_create(self, serializer):
        serializer.save(clinic_id=self.request.resolved_clinic_id)
