from rest_framework import viewsets

from accounts.permissions import HasPatientClinicAccess
from clinicians.api.serializers import ClinicianSerializer
from clinicians.models import Clinician
from patients.api.clinic_scope_mixin import ResolveClinicMixin


class ClinicianViewSet(ResolveClinicMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = ClinicianSerializer
    permission_classes = [HasPatientClinicAccess]

    def get_queryset(self):
        return Clinician.objects.filter(clinic_id=self.request.resolved_clinic_id).order_by(
            "last_name",
            "first_name",
        )
