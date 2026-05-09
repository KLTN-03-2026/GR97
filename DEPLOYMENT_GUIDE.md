# HealthyAI Deployment Guide

## Overview
This guide provides comprehensive deployment instructions for the HealthyAI healthcare platform using Docker and cloud platforms.

## Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   Frontend      │    │   Backend API   │
│   (Port 80/443) │────│   (Port 80)     │    │   (Port 5001)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   MongoDB       │
                    │   (Port 27017)  │
                    └─────────────────┘
```

## Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- MongoDB (cloud or local)
- SSL certificates (for production)

## Quick Start with Docker

### 1. Clone Repository
```bash
git clone <repository-url>
cd HealthyAI
```

### 2. Environment Setup
Create environment files:

```bash
# backend/.env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://mongodb:27017/healthyai
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-token-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://yourdomain.com
FRONTEND_URLS=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com
OPENAI_API_KEY=your-openai-api-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
VNPAY_TMNCODE=your-vnpay-code
VNPAY_HASHSECRET=your-vnpay-secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://yourdomain.com/payment/result
```

```bash
# frontend/.env.production
VITE_API_BASE_URL=https://yourdomain.com/api
VITE_APP_ENV=production
```

### 3. Docker Deployment

#### Single Command Deployment
```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

#### Docker Compose Configuration
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: healthyai-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: your-secure-password
      MONGO_INITDB_DATABASE: healthyai
    volumes:
      - mongodb_data:/data/db
      - ./docker/mongo-init:/docker-entrypoint-initdb.d
    networks:
      - healthyai-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 3

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: healthyai-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file:
      - ./backend/.env
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - healthyai-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: healthyai-frontend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    networks:
      - healthyai-network

  nginx:
    image: nginx:alpine
    container_name: healthyai-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - frontend
      - backend
    networks:
      - healthyai-network

volumes:
  mongodb_data:

networks:
  healthyai-network:
    driver: bridge
```

#### Dockerfile Configurations

```dockerfile
# backend/Dockerfile.prod
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app .

USER nodejs

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node --version || exit 1

CMD ["npm", "start"]
```

```dockerfile
# frontend/Dockerfile.prod
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built assets to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
```

#### Nginx Configuration
```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Performance
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    upstream backend {
        server backend:5001;
    }

    upstream frontend {
        server frontend:80;
    }

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }

    # SSL Configuration (if using SSL)
    # server {
    #     listen 443 ssl http2;
    #     server_name yourdomain.com www.yourdomain.com;
    #
    #     ssl_certificate /etc/nginx/ssl/cert.pem;
    #     ssl_certificate_key /etc/nginx/ssl/key.pem;
    #
    #     # SSL settings...
    # }
}
```

## Cloud Deployment Options

### 1. AWS Deployment

#### ECS Fargate
```yaml
# aws-ecs-task-definition.json
{
  "family": "healthyai-task",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "mongodb",
      "image": "mongo:7.0",
      "essential": true,
      "environment": [
        {"name": "MONGO_INITDB_ROOT_USERNAME", "value": "admin"},
        {"name": "MONGO_INITDB_ROOT_PASSWORD", "value": "secure-password"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/healthyai",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    },
    {
      "name": "backend",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/healthyai-backend:latest",
      "essential": true,
      "portMappings": [{"containerPort": 5001}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "MONGODB_URI", "value": "mongodb://mongodb:27017/healthyai"}
      ],
      "secrets": [
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/healthyai/jwt-XXXXXX"},
        {"name": "OPENAI_API_KEY", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/healthyai/openai-XXXXXX"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/healthyai-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    },
    {
      "name": "frontend",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/healthyai-frontend:latest",
      "essential": true,
      "portMappings": [{"containerPort": 80}],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/healthyai-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### AWS CLI Deployment Commands
```bash
# Build and push Docker images
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

docker build -f backend/Dockerfile.prod -t healthyai-backend ./backend
docker build -f frontend/Dockerfile.prod -t healthyai-frontend ./frontend

docker tag healthyai-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/healthyai-backend:latest
docker tag healthyai-frontend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/healthyai-frontend:latest

docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/healthyai-backend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/healthyai-frontend:latest

# Deploy to ECS
aws ecs update-service --cluster healthyai-cluster --service healthyai-service --force-new-deployment
```

### 2. DigitalOcean App Platform

```yaml
# .do/app.yaml
name: healthyai
services:
- name: backend
  source_dir: backend
  github:
    repo: yourusername/healthyai
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: MONGODB_URI
    value: ${MONGODB_URI}
  - key: JWT_SECRET
    value: ${JWT_SECRET}
    type: SECRET
  health_check:
    http_path: /api/health

- name: frontend
  source_dir: frontend
  github:
    repo: yourusername/healthyai
    branch: main
  build_command: npm run build
  run_command: npx serve -s dist -l 8080
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs

databases:
- name: mongodb
  engine: MONGODB
  version: "7"
  size: basic
  num_nodes: 1
```

### 3. Heroku Deployment

```json
# backend/package.json (add heroku scripts)
{
  "scripts": {
    "heroku-postbuild": "npm run build",
    "start": "node server.js"
  },
  "engines": {
    "node": "18.x"
  }
}
```

```yaml
# heroku.yml
build:
  docker:
    web: Dockerfile.prod
release:
  command:
    - npx prisma migrate deploy
  image: web
run:
  web: npm start
```

## SSL/TLS Configuration

### Let's Encrypt (Free SSL)
```bash
# Install certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### CloudFlare (CDN + SSL)
1. Sign up for CloudFlare
2. Add your domain
3. Update nameservers
4. Enable "Always Use HTTPS"
5. Set SSL mode to "Full (strict)"

## Monitoring & Logging

### Application Monitoring
```javascript
// backend/services/monitoring.js
import { monitor } from './performance-monitor.js';

export const setupMonitoring = (app) => {
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version,
    });
  });

  // Metrics endpoint
  app.get('/api/metrics', (req, res) => {
    res.json(monitor.getMetrics());
  });

  // Error tracking
  app.use((error, req, res, next) => {
    console.error('Error:', error);
    // Send to error tracking service (Sentry, Bugsnag, etc.)
    res.status(500).json({ message: 'Internal server error' });
  });
};
```

### Log Aggregation
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
```

## Backup & Recovery

### Database Backup
```bash
# MongoDB backup script
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db healthyai --out $BACKUP_DIR/backup_$DATE

# Compress and upload to cloud storage
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR backup_$DATE
aws s3 cp $BACKUP_DIR/backup_$DATE.tar.gz s3://your-backup-bucket/

# Cleanup old backups
find $BACKUP_DIR -name "backup_*" -mtime +7 -delete
```

### Automated Backups
```yaml
# docker-compose.backup.yml
version: '3.8'
services:
  backup:
    image: mongo:7.0
    volumes:
      - ./backup-script.sh:/backup-script.sh
    command: bash /backup-script.sh
    environment:
      - MONGO_HOST=mongodb
      - AWS_ACCESS_KEY_ID=your-key
      - AWS_SECRET_ACCESS_KEY=your-secret
    networks:
      - healthyai-network
```

## Scaling Strategies

### Horizontal Scaling
```yaml
# docker-compose.scaled.yml
version: '3.8'
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    deploy:
      resources:
        limits:
          memory: 512M

  loadbalancer:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/loadbalancer.conf:/etc/nginx/nginx.conf
```

### CDN Integration
```javascript
// frontend/src/lib/cdn.js
export const getCDNUrl = (path) => {
  const CDN_BASE = process.env.VITE_CDN_URL || '';
  return CDN_BASE ? `${CDN_BASE}${path}` : path;
};

// Usage
import { getCDNUrl } from '../lib/cdn';
<img src={getCDNUrl('/images/logo.png')} alt="Logo" />
```

## Security Hardening

### Docker Security
```dockerfile
# Use non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Minimize attack surface
RUN rm -rf /usr/local/lib/node_modules/npm/cache && \
    rm -rf /tmp/*

# Use distroless base image for production
FROM gcr.io/distroless/nodejs:18
```

### Network Security
```nginx
# nginx.conf - Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

## Troubleshooting

### Common Issues

1. **Container fails to start**
```bash
# Check logs
docker-compose logs <service-name>

# Check container status
docker ps -a

# Debug container
docker run -it <image> /bin/bash
```

2. **Database connection issues**
```bash
# Test MongoDB connection
docker exec -it healthyai-mongodb mongosh --eval "db.stats()"

# Check MongoDB logs
docker logs healthyai-mongodb
```

3. **Performance issues**
```bash
# Monitor resource usage
docker stats

# Check application metrics
curl http://localhost/api/metrics

# Profile Node.js application
npm install -g clinic
clinic doctor -- node server.js
```

## Maintenance

### Update Procedures
```bash
# Update application
docker-compose pull
docker-compose up -d

# Update with zero downtime
docker-compose up -d --scale backend=2
docker-compose up -d --scale backend=1
```

### Health Checks
```bash
# Application health
curl -f http://localhost/api/health

# Container health
docker ps --filter "health=unhealthy"

# System resources
docker system df
```

---

**Deployment Guide Version**: 1.0
**Last Updated**: May 9, 2026
**Supported Platforms**: Docker, AWS, DigitalOcean, Heroku