from rest_framework.permissions import BasePermission


class HasClinicProfile(BasePermission):
    message = "Authenticated user must be assigned to a clinic."

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        profile = getattr(user, "profile", None)
        return profile is not None and profile.clinic_id is not None
