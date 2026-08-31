.PHONY: help setup dev test build deploy clean

help:
	@echo "PassCard Development Commands"
	@echo "============================="
	@echo "make setup     - Setup development environment"
	@echo "make dev       - Start development servers"
	@echo "make test      - Run all tests"
	@echo "make build     - Build for production"
	@echo "make deploy    - Deploy to production"
	@echo "make clean     - Clean all generated files"

setup:
	@echo "Setting up development environment..."
	docker-compose build
	@echo "Setup complete!"

dev:
	@echo "Starting development servers..."
	docker-compose up

dev-logs:
	docker-compose logs -f

dev-stop:
	docker-compose down

test:
	@echo "Running tests..."
	docker-compose run --rm api npm test

docker-build:
	@echo "Building Docker images..."
	docker-compose build --no-cache

build:
	@echo "Building for production..."
	docker-compose run --rm api npm run build

db-reset:
	@echo "Resetting database..."
	docker-compose down -v
	docker-compose up -d mongodb redis

db-seed:
	@echo "Seeding database..."
	docker-compose run --rm api npm run seed

deploy:
	@echo "Deploying to production..."
	@echo "This requires proper credentials and configuration"

clean:
	@echo "Cleaning up..."
	docker-compose down -v
	find . -name 'node_modules' -type d -exec rm -rf {} + 2>/dev/null || true
