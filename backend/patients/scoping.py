"""
Resolve which clinic id scopes patient list/create/detail operations.

Documented order (see README):
1. DJANGO_FIXED_CLINIC_ID — single-tenant override; staff must belong to that clinic.
2. X-Clinic-Id or clinic_id query — must match non-superuser's clinic; superuser may
   use any existing clinic.
3. Otherwise — staff user's UserProfile.clinic (superusers must pass explicit clinic).
"""

from django.conf import settings
from rest_framework.exceptions import PermissionDenied, ValidationError

from clinics.models import Clinic


def resolve_clinic_id(request):
    user = request.user
    if not user.is_authenticated:
        raise PermissionDenied(detail="Authentication required.")

    fixed = getattr(settings, "FIXED_CLINIC_ID", None)
    if fixed is not None:
        if not Clinic.objects.filter(pk=fixed).exists():
            raise ValidationError(
                {
                    "detail": (
                        "Server misconfiguration: DJANGO_FIXED_CLINIC_ID does not match a clinic."
                    )
                }
            )
        if user.is_superuser:
            return fixed
        profile = getattr(user, "profile", None)
        if profile is None or profile.clinic_id != fixed:
            raise PermissionDenied(
                detail="Your account is not assigned to this deployment's fixed clinic."
            )
        return fixed

    raw = request.headers.get("X-Clinic-Id") or request.query_params.get("clinic_id")
    if raw is not None and str(raw).strip() != "":
        try:
            cid = int(raw)
        except (TypeError, ValueError) as exc:
            raise ValidationError({"clinic_id": "Must be a positive integer."}) from exc
        if cid < 1:
            raise ValidationError({"clinic_id": "Invalid clinic id."})
        if user.is_superuser:
            if not Clinic.objects.filter(pk=cid).exists():
                raise ValidationError({"clinic_id": "Clinic does not exist."})
            return cid
        profile = getattr(user, "profile", None)
        if profile is None or profile.clinic_id is None:
            raise PermissionDenied(detail="User must be assigned to a clinic.")
        if cid != profile.clinic_id:
            raise PermissionDenied(detail="Requested clinic does not match your clinic assignment.")
        return cid

    if user.is_superuser:
        raise ValidationError(
            {
                "detail": (
                    "Superusers must pass X-Clinic-Id or clinic_id to scope patient operations."
                )
            }
        )

    profile = getattr(user, "profile", None)
    if profile is None or profile.clinic_id is None:
        raise PermissionDenied(detail="User must be assigned to a clinic.")
    return profile.clinic_id
