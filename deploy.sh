#!/bin/bash

# HealthyAI Deployment Script
# This script automates the deployment process for HealthyAI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="healthyai"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backups"
ENV_FILE="./backend/.env"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    log_success "Dependencies check passed"
}

check_environment() {
    log_info "Checking environment configuration..."

    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file $ENV_FILE not found. Please create it with required variables."
        exit 1
    fi

    # Check required environment variables
    required_vars=("MONGODB_URI" "JWT_SECRET" "JWT_REFRESH_SECRET")
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$ENV_FILE"; then
            log_error "Required environment variable $var not found in $ENV_FILE"
            exit 1
        fi
    done

    log_success "Environment configuration check passed"
}

create_backup() {
    log_info "Creating database backup..."

    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).gz"

    if docker ps | grep -q "${PROJECT_NAME}-mongodb"; then
        docker exec "${PROJECT_NAME}-mongodb" mongodump --db healthyai --archive | gzip > "$BACKUP_FILE"
        log_success "Database backup created: $BACKUP_FILE"
    else
        log_warning "MongoDB container not running, skipping backup"
    fi
}

cleanup_old_backups() {
    log_info "Cleaning up old backups (keeping last 7)..."

    if [ -d "$BACKUP_DIR" ]; then
        ls -t "$BACKUP_DIR"/backup_*.gz 2>/dev/null | tail -n +8 | xargs -r rm --
        log_success "Old backups cleaned up"
    fi
}

build_images() {
    log_info "Building Docker images..."

    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    log_success "Docker images built successfully"
}

start_services() {
    log_info "Starting services..."

    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    log_success "Services started successfully"
}

wait_for_services() {
    log_info "Waiting for services to be healthy..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "healthy"; then
            log_success "All services are healthy"
            return 0
        fi

        log_info "Waiting for services... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done

    log_error "Services failed to become healthy within timeout"
    return 1
}

run_health_checks() {
    log_info "Running health checks..."

    # Backend health check
    if curl -f -s http://localhost/api/health > /dev/null; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        return 1
    fi

    # Frontend health check
    if curl -f -s http://localhost/ > /dev/null; then
        log_success "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        return 1
    fi
}

show_deployment_info() {
    log_success "Deployment completed successfully!"
    echo ""
    echo "🚀 Deployment Summary:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🌐 Frontend: http://localhost"
    echo "🔗 API: http://localhost/api"
    echo "💾 Database: MongoDB (healthyai)"
    echo "📊 Health Check: http://localhost/health"
    echo ""
    echo "🔧 Useful commands:"
    echo "  • View logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
    echo "  • Stop services: docker-compose -f $DOCKER_COMPOSE_FILE down"
    echo "  • Restart: docker-compose -f $DOCKER_COMPOSE_FILE restart"
    echo "  • Scale backend: docker-compose -f $DOCKER_COMPOSE_FILE up -d --scale backend=3"
    echo ""
}

rollback() {
    log_warning "Deployment failed. Starting rollback..."

    # Stop current deployment
    docker-compose -f "$DOCKER_COMPOSE_FILE" down

    # Restore from backup if available
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A $BACKUP_DIR)" ]; then
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.gz | head -1)
        if [ -f "$LATEST_BACKUP" ]; then
            log_info "Restoring from backup: $LATEST_BACKUP"
            gunzip < "$LATEST_BACKUP" | docker exec -i "${PROJECT_NAME}-mongodb" mongorestore --db healthyai --archive
        fi
    fi

    # Try to start previous version
    if docker images | grep -q "${PROJECT_NAME}-backend.*<none>"; then
        log_info "Attempting to start previous version..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    fi

    log_error "Rollback completed. Please check the logs and fix issues manually."
    exit 1
}

main() {
    echo "🚀 HealthyAI Deployment Script"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Pre-deployment checks
    check_dependencies
    check_environment

    # Backup current state
    create_backup
    cleanup_old_backups

    # Deployment process
    build_images

    # Stop on failure
    trap rollback ERR

    start_services
    wait_for_services
    run_health_checks

    # Success
    show_deployment_info
}

# Parse command line arguments
case "${1:-}" in
    "build")
        check_dependencies
        build_images
        ;;
    "start")
        check_dependencies
        start_services
        ;;
    "stop")
        docker-compose -f "$DOCKER_COMPOSE_FILE" down
        log_success "Services stopped"
        ;;
    "restart")
        docker-compose -f "$DOCKER_COMPOSE_FILE" restart
        log_success "Services restarted"
        ;;
    "logs")
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f
        ;;
    "backup")
        create_backup
        ;;
    "health")
        run_health_checks
        ;;
    "cleanup")
        cleanup_old_backups
        log_success "Cleanup completed"
        ;;
    *)
        main
        ;;
esac