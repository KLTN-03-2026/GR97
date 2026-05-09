# HealthyAI Makefile
# Use this Makefile to manage deployment tasks

.PHONY: help build up down restart logs backup restore health clean deploy dev prod

# Default target
help: ## Show this help message
	@echo "HealthyAI Deployment Makefile"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development commands
dev: ## Start development environment
	docker-compose -f docker-compose.yml up -d
	@echo "Development environment started at http://localhost:5173"

dev-build: ## Build and start development environment
	docker-compose -f docker-compose.yml up -d --build

dev-logs: ## View development logs
	docker-compose -f docker-compose.yml logs -f

dev-stop: ## Stop development environment
	docker-compose -f docker-compose.yml down

# Production commands
build: ## Build production Docker images
	docker-compose -f docker-compose.prod.yml build --no-cache

up: ## Start production services
	docker-compose -f docker-compose.prod.yml up -d

down: ## Stop production services
	docker-compose -f docker-compose.prod.yml down

restart: ## Restart production services
	docker-compose -f docker-compose.prod.yml restart

logs: ## View production logs
	docker-compose -f docker-compose.prod.yml logs -f

status: ## Show service status
	docker-compose -f docker-compose.prod.yml ps

# Deployment
deploy: ## Full production deployment with backup
	./deploy.sh

deploy-quick: ## Quick deployment without backup
	@echo "Building images..."
	docker-compose -f docker-compose.prod.yml build
	@echo "Starting services..."
	docker-compose -f docker-compose.prod.yml up -d
	@echo "Waiting for services..."
	sleep 30
	@echo "Checking health..."
	./deploy.sh health

# Database operations
backup: ## Create database backup
	./deploy.sh backup

restore: ## Restore database from latest backup
	@echo "Restoring database..."
	docker-compose -f docker-compose.prod.yml exec mongodb mongorestore --db healthyai /data/backup

# Monitoring
health: ## Run health checks
	./deploy.sh health

metrics: ## Show application metrics
	curl -s http://localhost/api/metrics | jq .

monitor: ## Start monitoring dashboard
	docker run -d --name healthyai-monitor -p 3000:3000 \
		-v /var/run/docker.sock:/var/run/docker.sock \
		portainer/portainer

# Maintenance
clean: ## Clean up unused Docker resources
	docker system prune -f
	docker volume prune -f

clean-all: ## Clean up everything including volumes
	docker-compose -f docker-compose.prod.yml down -v
	docker system prune -a -f --volumes

update: ## Update all services
	docker-compose -f docker-compose.prod.yml pull
	docker-compose -f docker-compose.prod.yml up -d

# Security
audit: ## Run security audit
	docker run --rm -v $(PWD):/app -w /app \
		node:18-alpine sh -c "npm audit && npm run lint"

scan: ## Scan for vulnerabilities
	docker run --rm -v $(PWD):/app -w /app \
		aquasecurity/trivy fs --format table --output /dev/null /app

# Testing
test: ## Run all tests
	docker-compose -f docker-compose.test.yml up --abort-on-container-exit

test-unit: ## Run unit tests
	cd backend && npm test

test-e2e: ## Run end-to-end tests
	docker-compose -f docker-compose.e2e.yml up --abort-on-container-exit

# SSL/HTTPS
ssl-cert: ## Generate SSL certificate with Let's Encrypt
	@echo "Make sure your domain points to this server"
	@echo "Then run: sudo certbot --nginx -d yourdomain.com"

ssl-renew: ## Renew SSL certificate
	sudo certbot renew

# Cloud deployment helpers
cloud-build: ## Build for cloud deployment
	docker build -f backend/Dockerfile.prod -t healthyai-backend:latest ./backend
	docker build -f frontend/Dockerfile.prod -t healthyai-frontend:latest ./frontend

cloud-push: ## Push images to registry (set REGISTRY env var)
	docker tag healthyai-backend:latest $(REGISTRY)/healthyai-backend:latest
	docker tag healthyai-frontend:latest $(REGISTRY)/healthyai-frontend:latest
	docker push $(REGISTRY)/healthyai-backend:latest
	docker push $(REGISTRY)/healthyai-frontend:latest

# Environment management
env-check: ## Check environment variables
	@echo "Checking backend environment..."
	@if [ ! -f backend/.env ]; then echo "❌ backend/.env not found"; exit 1; fi
	@echo "✅ backend/.env exists"
	@grep -E "^(NODE_ENV|MONGODB_URI|JWT_SECRET)=" backend/.env > /dev/null || (echo "❌ Missing required env vars"; exit 1)
	@echo "✅ Required environment variables present"

env-template: ## Generate environment template
	@echo "# Backend Environment Variables" > backend/.env.template
	@echo "NODE_ENV=production" >> backend/.env.template
	@echo "PORT=5001" >> backend/.env.template
	@echo "MONGODB_URI=mongodb://localhost:27017/healthyai" >> backend/.env.template
	@echo "JWT_SECRET=your-super-secure-jwt-secret" >> backend/.env.template
	@echo "JWT_REFRESH_SECRET=your-refresh-token-secret" >> backend/.env.template
	@echo "FRONTEND_URL=https://yourdomain.com" >> backend/.env.template
	@echo "# Add other required variables..." >> backend/.env.template
	@echo "✅ Environment template created: backend/.env.template"

# Documentation
docs: ## Generate API documentation
	cd backend && npm run docs
	@echo "API documentation generated"

# Emergency commands
emergency-stop: ## Emergency stop all services
	docker stop $$(docker ps -q) 2>/dev/null || true
	docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

emergency-restart: ## Emergency restart from backup
	$(MAKE) emergency-stop
	$(MAKE) restore
	$(MAKE) up