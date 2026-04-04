.PHONY: up down migrate seed test test-backend test-frontend clean

up:
	docker compose up -d --build

down:
	docker compose down -v

migrate:
	docker compose exec backend uv run alembic upgrade head

seed:
	docker compose exec backend uv run python scripts/seed_demo_data.py

test: test-backend test-frontend

test-backend:
	docker compose exec backend uv run pytest -q

test-frontend:
	docker compose exec frontend npm test -- --run

clean:
	docker compose down -v --rmi local
	rm -rf frontend/dist frontend/node_modules backend/.venv
