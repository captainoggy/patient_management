from rest_framework import viewsets

from accounts.permissions import HasPatientClinicAccess
from appointments.api.serializers import (
    AppointmentSerializer,
    AppointmentWriteSerializer,
)
from appointments.models import Appointment
from patients.api.clinic_scope_mixin import ResolveClinicMixin


class AppointmentViewSet(ResolveClinicMixin, viewsets.ModelViewSet):
    permission_classes = [HasPatientClinicAccess]
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return AppointmentWriteSerializer
        return AppointmentSerializer

    def get_queryset(self):
        return (
            Appointment.objects.filter(patient__clinic_id=self.request.resolved_clinic_id)
            .select_related("patient")
            .prefetch_related("clinicians")
            .order_by("-scheduled_at")
        )
