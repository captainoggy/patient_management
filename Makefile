.PHONY: up down migrate test-backend lint-backend test-frontend check-frontend

up:
	docker compose up --build

down:
	docker compose down

migrate:
	docker compose run --rm api python manage.py migrate

test-backend:
	cd backend && DJANGO_DB_ENGINE=sqlite DJANGO_SECRET_KEY=test python3 manage.py test patients appointments -v 2

lint-backend:
	cd backend && python3 -m pip install -q -r requirements-dev.txt && python3 -m ruff check . && python3 -m ruff format --check .

# npm ci: reproducible install (requires package-lock.json in sync)
test-frontend:
	cd frontend && npm run test:run

check-frontend:
	cd frontend && npm run test:ci
