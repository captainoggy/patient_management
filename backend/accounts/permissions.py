from rest_framework.permissions import BasePermission


class HasPatientClinicAccess(BasePermission):
    """
    Staff must have a clinic profile. Superusers may access patient APIs without a profile
    but must pass explicit clinic scope (see patients.scoping.resolve_clinic_id).
    """

    message = "Authentication with clinic access required."

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        profile = getattr(user, "profile", None)
        return profile is not None and profile.clinic_id is not None
