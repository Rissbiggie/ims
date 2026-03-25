.PHONY: help build up down logs shell migrate migrate-fresh seed clear-cache tinker routes setup allow-permissions fix-permissions

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build Docker images
	docker compose build

##restart: ## Restart all services
 ##  docker compose restart	

up: ## Start all services
	docker compose up -d
	@echo "✓ Access app at http://localhost:8000"

down: ## Stop all services
	docker compose down

allow-permissions: ## Set folder ownership to the web server
	docker compose exec app chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache /var/www/database

fix-permissions: ## Set folder permissions (read/write)
	docker compose exec app chmod -R 775 /var/www/storage /var/www/bootstrap/cache /var/www/database

shell: ## Open shell in app container
	docker compose exec app sh

migrate: ## Run database migrations
	docker compose exec app php artisan migrate --force

migrate-fresh: ## Reset and re-run migrations
	docker compose exec app php artisan migrate:fresh --seed --force

clear-cache: ## Clear all application caches
	docker compose exec app php artisan cache:clear
	docker compose exec app php artisan config:clear
	docker compose exec app php artisan route:clear
	@echo "✓ All caches cleared"

logs: ## View container logs
	docker compose logs -f app

tinker: ## Open Laravel Tinker
	docker compose exec app php artisan tinker	
routes: ## List all application routes
	docker compose exec app php artisan route:list	
deploy: ## Prepare the app for a production-like environment
	@echo "🚀 Starting Deployment sequence..."
	docker compose exec app composer install --no-dev --optimize-autoloader
	docker compose exec app php artisan key:generate --force
	@make migrate-fresh @make clear-cache
	@make allow-permissions
	@make fix-permissions
	@echo "✨ Deployment successful! Visit http://localhost:8000"

restart: ## Quick fix for Linux permission 500 errors
	docker compose restart 