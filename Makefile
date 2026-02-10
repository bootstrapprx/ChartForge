.PHONY: dev stop reset-db logs

# Default shell
SHELL := /bin/bash

# Variables
BACKEND_DIR = ./backend
FRONTEND_DIR = ./frontend
DOCKER_COMPOSE_DEV = ./docker-compose.dev.yml

dev:
	@echo "Starting Unified Dev Mode..."
	@echo "Starting Docker services (Postgres, Ollama, Backend, Frontend)"
	docker compose -f $(DOCKER_COMPOSE_DEV) up -d --build
	@echo "Unified Dev Mode is running."
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8000"
	@echo "Ollama: http://localhost:11434"
	@echo "Postgres: localhost:5432"

stop:
	@echo "Stopping Unified Dev Mode..."
	@echo "Stopping Docker services..."
	docker compose -f $(DOCKER_COMPOSE_DEV) down
	@echo "All services stopped."

reset-db:
	@echo "Resetting development database..."
	docker compose -f $(DOCKER_COMPOSE_DEV) down -v
	docker compose -f $(DOCKER_COMPOSE_DEV) up -d postgres
	@echo "Database reset complete."

logs:
	@echo "Following Docker logs..."
	docker compose -f $(DOCKER_COMPOSE_DEV) logs -f

# Placeholder for optional services
services:
	@echo "Managing optional services..."
	@if [ -d "services" ]; then \
		for service_dir in services/*; do \
			if [ -f "$$service_dir/main.cpp" ]; then \
				echo "Found C++ service in $$service_dir"; \
				# Add compilation and run commands here \
			elif [ -f "$$service_dir/main.go" ]; then \
				echo "Found Go service in $$service_dir"; \
				# Add compilation and run commands here \
			elif [ -f "$$service_dir/main.rs" ]; then \
				echo "Found Rust service in $$service_dir"; \
				# Add compilation and run commands here \
			fi; \
		done; \
	else \
		echo "No 'services' directory found."; \
	fi
