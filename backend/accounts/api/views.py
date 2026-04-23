from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response


@ensure_csrf_cookie
@api_view(["GET"])
@permission_classes([AllowAny])
def auth_session(request):
    if request.user.is_authenticated:
        profile = getattr(request.user, "profile", None)
        if profile and profile.clinic_id:
            return Response(
                {
                    "authenticated": True,
                    "clinic": {
                        "id": profile.clinic.id,
                        "name": profile.clinic.name,
                        "slug": profile.clinic.slug,
                    },
                    "csrf": get_token(request),
                }
            )
    return Response({"authenticated": False, "csrf": get_token(request)})


@api_view(["POST"])
@permission_classes([AllowAny])
def auth_login(request):
    username = request.data.get("username")
    password = request.data.get("password")
    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response(
            {"detail": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    profile = getattr(user, "profile", None)
    if profile is None or profile.clinic_id is None:
        return Response(
            {"detail": "User is not assigned to a clinic."},
            status=status.HTTP_403_FORBIDDEN,
        )
    login(request, user)
    return Response(
        {
            "clinic": {
                "id": profile.clinic.id,
                "name": profile.clinic.name,
                "slug": profile.clinic.slug,
            },
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def auth_logout(request):
    logout(request)
    return Response(status=status.HTTP_204_NO_CONTENT)
