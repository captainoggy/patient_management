FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x /app/docker-entrypoint.sh \
    && adduser --disabled-password --gecos "" appuser \
    && chown -R appuser:appuser /app

ENV DJANGO_SETTINGS_MODULE=config.settings

USER appuser

EXPOSE 8000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
