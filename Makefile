.PHONY: up down migrate test-backend

up:
	docker compose up --build

down:
	docker compose down

migrate:
	docker compose run --rm api python manage.py migrate

test-backend:
	cd backend && DJANGO_DB_ENGINE=sqlite DJANGO_SECRET_KEY=test python manage.py test patients -v 2
