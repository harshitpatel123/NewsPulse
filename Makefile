-include .env
export

APP_NAME := newspulse
NPM      := npm
PM2      := pm2
NAME     ?= change

# OS detection
ifeq ($(OS),Windows_NT)
  SHELL        := powershell.exe
  .SHELLFLAGS  := -NoProfile -Command
  FREE_PORT     = $$p = Get-NetTCPConnection -LocalPort $(1) -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($$p) { $$p | ForEach-Object { Stop-Process -Id $$_ -Force -ErrorAction SilentlyContinue } }; if (Get-NetTCPConnection -LocalPort $(1) -State Listen -ErrorAction SilentlyContinue) { Write-Host 'Port $(1) still in use, retrying with admin privileges...'; Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile -Command "Get-NetTCPConnection -LocalPort $(1) -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $$_ -Force -ErrorAction SilentlyContinue }"' }; if (Get-NetTCPConnection -LocalPort $(1) -State Listen -ErrorAction SilentlyContinue) { Write-Error 'ERROR: port $(1) could not be freed. Aborting.'; exit 1 }
  MKDIR_P       = if (-not (Test-Path $(1))) { New-Item -ItemType Directory $(1) | Out-Null }
  TIMESTAMP     = Get-Date -Format 'yyyyMMdd-HHmmss'
  CONFIRM       = $$a = Read-Host "$(1)"; if ($$a -ne 'yes') { Write-Host 'Aborted.'; exit 1 }
  ENSURE_DOCKER  = docker info 2>&1 | Out-Null; if ($$LASTEXITCODE -ne 0) { if (-not (Get-Process 'Docker Desktop' -ErrorAction SilentlyContinue)) { Write-Host 'Starting Docker Desktop...'; Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe' }; Write-Host 'Waiting for Docker engine...'; $$ready = $$false; for ($$i = 1; $$i -le 30; $$i++) { docker info 2>&1 | Out-Null; if ($$LASTEXITCODE -eq 0) { $$ready = $$true; break }; Write-Host "  Docker not ready yet ($$i/30)..."; Start-Sleep 3 }; if (-not $$ready) { Write-Error 'ERROR: Docker did not start. Aborting.'; exit 1 } } else { Write-Host 'Docker engine already running.' }
else
  SHELL        := /bin/bash
  FREE_PORT     = fuser -k $(1)/tcp 2>/dev/null || true; if fuser $(1)/tcp >/dev/null 2>&1; then sudo fuser -k $(1)/tcp 2>/dev/null || true; fi; if fuser $(1)/tcp >/dev/null 2>&1; then echo 'ERROR: port $(1) could not be freed. Aborting.'; exit 1; fi
  MKDIR_P       = mkdir -p $(1)
  TIMESTAMP     = date +%Y%m%d-%H%M%S
  CONFIRM       = read -p "$(1) " a; [ "$$a" = "yes" ]
endif

.DEFAULT_GOAL := help
.PHONY: help install dev build start start-prod stop restart status logs \
        db-up db-down db-logs db-reset db-backup \
        migrate migrate-create types \
        seed seed-dummy seed-reset \
        lint typecheck test test-security check deploy

help: ## Show this help
ifeq ($(OS),Windows_NT)
	@Get-Content $(MAKEFILE_LIST) | Select-String '^[a-zA-Z_-]+:.*## ' | ForEach-Object { $$_ -replace ':.*## ','|' } | ForEach-Object { $$p = $$_ -split '\|'; Write-Host ("  {0,-16} {1}" -f $$p[0], $$p[1]) }
else
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*## "}{printf "  %-16s %s\n", $$1, $$2}'
endif

install: ## Install dependencies from the lockfile
	$(NPM) ci

dev: db-up ## Local development server (starts Postgres first)
	$(NPM) run dev

build: ## Production build (Postgres must be running)
	$(NPM) run build

start: ## Install deps, free ports, start Postgres, migrate, start app in watch mode (dev)
	$(NPM) i
	@$(call FREE_PORT,3000)
	@$(call FREE_PORT,5432)
	@$(ENSURE_DOCKER)
	docker compose up -d --wait db
ifeq ($(OS),Windows_NT)
	@$$ok = $$false; for ($$i = 1; $$i -le 20; $$i++) { docker compose exec -T db pg_isready -U $(POSTGRES_USER) -d $(POSTGRES_DB) 2>&1 | Out-Null; if ($$LASTEXITCODE -eq 0) { $$ok = $$true; break }; Write-Host "  Postgres not ready yet ($$i/20)..."; Start-Sleep 2 }; if (-not $$ok) { Write-Error 'ERROR: Postgres did not become ready. Aborting.'; exit 1 }
else
	@for i in $$(seq 1 20); do \
		docker compose exec -T db pg_isready -U $(POSTGRES_USER) -d $(POSTGRES_DB) >/dev/null 2>&1 && break; \
		echo "  Postgres not ready yet ($$i/20)..."; sleep 2; \
		if [ $$i -eq 20 ]; then echo "ERROR: Postgres did not become ready. Aborting."; exit 1; fi; \
	done
endif
	$(NPM) run payload migrate
	$(NPM) run dev

start-prod: ## Install deps, free ports, start Postgres, migrate, build, start app (production)
	$(NPM) i
	@$(call FREE_PORT,3000)
	@$(call FREE_PORT,5432)
	@$(ENSURE_DOCKER)
	docker compose up -d --wait db
ifeq ($(OS),Windows_NT)
	@$$ok = $$false; for ($$i = 1; $$i -le 20; $$i++) { docker compose exec -T db pg_isready -U $(POSTGRES_USER) -d $(POSTGRES_DB) 2>&1 | Out-Null; if ($$LASTEXITCODE -eq 0) { $$ok = $$true; break }; Write-Host "  Postgres not ready yet ($$i/20)..."; Start-Sleep 2 }; if (-not $$ok) { Write-Error 'ERROR: Postgres did not become ready. Aborting.'; exit 1 }
else
	@for i in $$(seq 1 20); do \
		docker compose exec -T db pg_isready -U $(POSTGRES_USER) -d $(POSTGRES_DB) >/dev/null 2>&1 && break; \
		echo "  Postgres not ready yet ($$i/20)..."; sleep 2; \
		if [ $$i -eq 20 ]; then echo "ERROR: Postgres did not become ready. Aborting."; exit 1; fi; \
	done
endif
	$(NPM) run payload migrate
	$(NPM) run build
ifeq ($(OS),Windows_NT)
	$(NPM) start
else
	$(PM2) startOrReload ecosystem.config.cjs
	$(PM2) save
endif

stop: ## Stop the app and Postgres
ifeq ($(OS),Windows_NT)
	@Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $$_ -Force -ErrorAction SilentlyContinue }
else
	-$(PM2) stop $(APP_NAME)
	-$(PM2) delete $(APP_NAME)
	@$(call FREE_PORT,3000)
endif
	docker compose stop db

restart: ## Reload the app without downtime
ifeq ($(OS),Windows_NT)
	$(MAKE) stop start
else
	$(PM2) reload $(APP_NAME)
endif

status: ## Show Postgres and app status
	docker compose ps
ifeq ($(OS),Windows_NT)
	@$$p = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue; if ($$p) { Write-Host 'App: running on port 3000' } else { Write-Host 'App: not running' }
else
	$(PM2) status
endif

logs: ## Tail the app logs
ifeq ($(OS),Windows_NT)
	@Write-Host 'On Windows the app runs in its own PowerShell window. Check that window for logs.'
else
	$(PM2) logs $(APP_NAME) --lines 100
endif

db-up: ## Start Postgres and wait until it is healthy
	docker compose up -d --wait db

db-down: ## Stop Postgres (data is kept)
	docker compose stop db

db-logs: ## Tail Postgres logs
	docker compose logs -f --tail 100 db

db-reset: ## DANGER: delete ALL database data, recreate and migrate
	@$(call CONFIRM,This deletes ALL data. Type 'yes' to continue:)
	docker compose down -v
	$(MAKE) db-up migrate

db-backup: ## Dump the database to backups/
	@$(call MKDIR_P,backups)
ifeq ($(OS),Windows_NT)
	@$$ts = $(TIMESTAMP); docker compose exec -T db pg_dump -U $(POSTGRES_USER) $(POSTGRES_DB) > "backups/$$ts.sql"
else
	docker compose exec -T db pg_dump -U $(POSTGRES_USER) $(POSTGRES_DB) > backups/$$($(TIMESTAMP)).sql
endif

migrate: db-up ## Apply database migrations
	$(NPM) run payload migrate

migrate-create: ## Create a migration e.g. make migrate-create NAME=add-views
	$(NPM) run payload migrate:create $(NAME)

types: ## Regenerate Payload types and the admin import map
	$(NPM) run generate:types
	$(NPM) run generate:importmap

seed: migrate ## Essential data only: admin account, categories, empty breaking news
	$(NPM) run seed

seed-dummy: seed ## Demo data: 2 editors, 20 articles, images, breaking news
	$(NPM) run seed:dummy

seed-reset: ## DANGER: wipe the database, then run seed and seed-dummy
	$(MAKE) db-reset
	$(MAKE) seed-dummy

lint: ## Run the linter
	$(NPM) run lint

typecheck: ## Run the TypeScript compiler without emitting
	$(NPM) run typecheck

test: ## Unit tests
	$(NPM) run test

test-security: ## REST security tests against SEC_BASE_URL (server must be running)
	$(NPM) run test:security

check: lint typecheck test ## Lint, typecheck and unit tests

deploy: ## Update a running server: pull, install, migrate, build, reload
	git pull --ff-only
	$(MAKE) install migrate build restart
