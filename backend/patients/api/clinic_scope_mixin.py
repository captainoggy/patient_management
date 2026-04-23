from patients.scoping import resolve_clinic_id


class ResolveClinicMixin:
    """Attach `request.resolved_clinic_id` using the same rules as patient APIs."""

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        request.resolved_clinic_id = resolve_clinic_id(request)
