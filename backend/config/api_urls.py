from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from accounts.api.views import auth_login, auth_logout, auth_session
from appointments.api.views import AppointmentViewSet
from clinicians.api.views import ClinicianViewSet
from patients.api.views import PatientViewSet


def health(_request):
    return JsonResponse({"status": "ok"})


router = DefaultRouter()
router.register("patients", PatientViewSet, basename="patient")
router.register("clinicians", ClinicianViewSet, basename="clinician")
router.register("appointments", AppointmentViewSet, basename="appointment")

urlpatterns = [
    path("v1/health/", health, name="health"),
    path(
        "v1/",
        include(
            [
                path("auth/session/", auth_session, name="auth_session"),
                path("auth/login/", auth_login, name="auth_login"),
                path("auth/logout/", auth_logout, name="auth_logout"),
                path("", include(router.urls)),
            ]
        ),
    ),
]
