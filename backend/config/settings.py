"""
Django settings — 12-factor style via environment variables for Docker and CI.
"""

import logging
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# `python manage.py test` — disable API throttling so large test runs never hit rate limits.
RUNNING_TESTS = len(sys.argv) > 1 and sys.argv[0].endswith("manage.py") and sys.argv[1] == "test"

SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "dev-only-change-in-production-not-secret",
)
DEBUG = os.environ.get("DJANGO_DEBUG", "true").lower() in ("1", "true", "yes")

raw_hosts = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,api")
ALLOWED_HOSTS = [h.strip() for h in raw_hosts.split(",") if h.strip()]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "clinics",
    "clinicians",
    "patients",
    "appointments",
    "accounts",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

_db_engine = os.environ.get("DJANGO_DB_ENGINE", "postgresql")
if _db_engine == "sqlite":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / os.environ.get("SQLITE_PATH", "db.sqlite3"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("POSTGRES_DB", "patient_mgmt"),
            "USER": os.environ.get("POSTGRES_USER", "patient_mgmt"),
            "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "patient_mgmt"),
            "HOST": os.environ.get("POSTGRES_HOST", "localhost"),
            "PORT": os.environ.get("POSTGRES_PORT", "5432"),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

_fixed_clinic = os.environ.get("DJANGO_FIXED_CLINIC_ID", "").strip()
FIXED_CLINIC_ID = int(_fixed_clinic) if _fixed_clinic.isdigit() else None

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework.authentication.SessionAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),
    "DEFAULT_PARSER_CLASSES": ("rest_framework.parsers.JSONParser",),
    "DEFAULT_PAGINATION_CLASS": "config.pagination.StandardPageNumberPagination",
}
if not RUNNING_TESTS:
    REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = (
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.AnonRateThrottle",
    )
    REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {
        "user": "1000/hour",
        "anon": "100/minute",
    }

# Browser UI is same-origin with the API (Vite proxy in dev, nginx in Docker).
_raw_csrf_trusted = os.environ.get(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173," "http://localhost:8080,http://127.0.0.1:8080",
)
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _raw_csrf_trusted.split(",") if o.strip()]

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"

LOGGING: dict = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "std": {
            "format": "{levelname} {asctime} {name} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "std",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": os.environ.get("DJANGO_LOG_LEVEL", "INFO"),
    },
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}
logging.captureWarnings(True)

# Render / Vercel-style HTTPS behind a reverse proxy (set only for real TLS deployments).
if os.environ.get("DJANGO_HTTPS_DEPLOYMENT", "").lower() in ("1", "true", "yes"):
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    if os.environ.get("DJANGO_SECURE_SSL_REDIRECT", "1").lower() in ("1", "true", "yes"):
        SECURE_SSL_REDIRECT = True
    _hsts = int(os.environ.get("DJANGO_SECURE_HSTS_SECONDS", "31536000"))
    if _hsts > 0:
        SECURE_HSTS_SECONDS = _hsts
        SECURE_HSTS_INCLUDE_SUBDOMAINS = os.environ.get("DJANGO_HSTS_SUBDOMAINS", "1").lower() in (
            "1",
            "true",
            "yes",
        )
        if os.environ.get("DJANGO_HSTS_PRELOAD", "").lower() in ("1", "true", "yes"):
            SECURE_HSTS_PRELOAD = True
