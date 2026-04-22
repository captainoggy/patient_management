#!/bin/sh
set -e

python manage.py migrate --noinput

if [ "${SEED_DEMO:-}" = "1" ]; then
  python manage.py seed_demo
fi

PORT="${PORT:-8000}"
exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT}" --workers 3
