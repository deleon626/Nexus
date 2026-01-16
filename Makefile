.PHONY: dev dev-no-docker backend web db db-detach db-down db-clean install test lint format logs logs-docker logs-backend logs-web clean help
.DEFAULT_GOAL := help

# === MAIN COMMANDS ===
dev:                    ## Start all (Docker + Backend + Frontend)
	@npm run dev

dev-no-docker:          ## Start backend + frontend only
	@npm run dev:no-docker

# === INDIVIDUAL SERVICES ===
backend:                ## Start backend only (port 8000)
	@cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

web:                    ## Start frontend only (port 5173)
	@cd web && npm run dev

db:                     ## Start Docker services
	@docker-compose up

db-detach:              ## Start Docker in background
	@docker-compose up -d

db-down:                ## Stop Docker services
	@docker-compose down

db-clean:               ## Stop Docker + remove volumes
	@docker-compose down -v

# === SETUP ===
install:                ## Install all dependencies
	@npm install && cd web && npm install && cd ../backend && uv sync

# === CODE QUALITY ===
test:                   ## Run backend tests
	@cd backend && uv run pytest

lint:                   ## Run linters
	@cd backend && uv run ruff check app/ && cd ../web && npm run lint

format:                 ## Format backend code
	@cd backend && uv run black app/ && uv run ruff check app/ --fix

# === LOGS ===
logs:                   ## Stream all logs (Docker + Backend + Web)
	@npm run logs

logs-docker:            ## Stream Docker logs only
	@docker-compose logs -f

logs-backend:           ## Stream backend logs only
	@npm run logs:backend

logs-web:               ## Stream web logs only
	@npm run logs:web

# === CLEANUP ===
clean:                  ## Full cleanup
	@docker-compose down -v 2>/dev/null || true
	@rm -rf node_modules web/node_modules backend/.venv

# === HELP ===
help:                   ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
