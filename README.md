# HealthyAI - Healthcare AI Platform

[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://docker.com)
[![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=flat&logo=mongodb&logoColor=white)](https://mongodb.com)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org)

A comprehensive healthcare platform with AI-powered diagnostics, appointment management, and telemedicine capabilities.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for development)
- 4GB RAM minimum
- 10GB disk space

### One-Command Deployment
```bash
# Clone and deploy
git clone <repository-url>
cd HealthyAI
make deploy
```

Visit: http://localhost

## 📋 Features

### 🤖 AI-Powered Features
- **Medical Chat Assistant**: AI-powered symptom analysis and health advice
- **Image Analysis**: GPT-4 Vision integration for medical image analysis
- **Smart Recommendations**: Personalized doctor and specialty suggestions
- **Emergency Detection**: Automatic emergency situation detection

### 👨‍⚕️ Healthcare Management
- **Doctor Profiles**: Comprehensive doctor information and ratings
- **Appointment Booking**: Online appointment scheduling
- **Medical Records**: Secure patient record management
- **Video Consultation**: Real-time telemedicine

### 🔐 Security & Compliance
- **End-to-End Encryption**: Secure data transmission
- **Role-Based Access**: Patient, Doctor, Admin roles
- **Audit Logging**: Comprehensive activity logging
- **GDPR Compliance**: Data protection and privacy

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   React SPA     │    │   Node.js API   │
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

## 🛠️ Development Setup

### Local Development
```bash
# Install dependencies
npm run install:all

# Start development servers
npm run start:all

# Frontend: http://localhost:5173
# Backend: http://localhost:5001
# Admin: http://localhost:5174
```

### Docker Development
```bash
# Start with Docker
make dev

# View logs
make dev-logs
```

## 🚀 Production Deployment

### Automated Deployment
```bash
# Full deployment with backup
make deploy

# Quick deployment
make deploy-quick
```

### Manual Deployment
```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Check health
curl http://localhost/health
```

### Environment Configuration
```bash
# Copy environment template
cp backend/.env.template backend/.env

# Edit with your values
nano backend/.env
```

Required environment variables:
```env
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/healthyai
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
FRONTEND_URL=https://yourdomain.com
OPENAI_API_KEY=your-openai-api-key
EMAIL_USER=your-email@gmail.com
VNPAY_TMNCODE=your-vnpay-merchant-code
```

## ☁️ Cloud Deployment

### AWS ECS
```bash
# Build and push images
make cloud-build REGISTRY=123456789012.dkr.ecr.us-east-1.amazonaws.com
make cloud-push

# Deploy to ECS
aws ecs update-service --cluster healthyai-cluster --service healthyai-service --force-new-deployment
```

### DigitalOcean App Platform
1. Connect GitHub repository
2. Use provided app.yaml configuration
3. Deploy automatically on push

### Heroku
```bash
# Deploy backend
heroku create healthyai-backend
git push heroku main

# Deploy frontend (static)
heroku create healthyai-frontend --buildpack heroku/static
```

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Application health
make health

# View metrics
make metrics

# Monitor logs
make logs
```

### Database Backup
```bash
# Automated backup
make backup

# Manual backup
docker exec healthyai-mongodb mongodump --db healthyai --out /backup

# Restore
make restore
```

### Performance Monitoring
```bash
# Start monitoring dashboard
make monitor

# View real-time metrics
curl http://localhost/api/metrics
```

## 🔒 Security

### Security Features
- JWT authentication with refresh tokens
- Rate limiting and DDoS protection
- Input validation and sanitization
- CORS configuration
- Security headers (Helmet.js)
- File upload validation

### Security Audit
```bash
# Run security audit
make audit

# Vulnerability scanning
make scan
```

## 🧪 Testing

### Unit Tests
```bash
make test-unit
```

### Integration Tests
```bash
make test
```

### End-to-End Tests
```bash
make test-e2e
```

### Penetration Testing
```bash
cd backend
node penetration-test.js
```

## 📚 API Documentation

### REST API Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/login` - User login
- `GET /api/doctors` - List doctors
- `POST /api/chat/support` - AI chat support
- `POST /api/appointments` - Book appointment

### WebSocket Events
- `connection` - Client connection
- `message` - Real-time messaging
- `video-call` - Video consultation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues
- **Port conflicts**: Change ports in docker-compose files
- **Memory issues**: Increase Docker memory limit
- **Database connection**: Check MongoDB credentials
- **SSL issues**: Verify certificate paths

### Getting Help
- 📧 Email: support@healthyai.com
- 📖 Docs: [Documentation](./docs)
- 🐛 Issues: [GitHub Issues](https://github.com/yourorg/healthyai/issues)

## 📈 Roadmap

### Version 2.0 (Q3 2026)
- [ ] Mobile app development
- [ ] Advanced AI diagnostics
- [ ] Integration with hospital systems
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

### Version 1.5 (Q2 2026)
- [ ] Voice consultation
- [ ] Prescription management
- [ ] Health tracking dashboard
- [ ] Emergency response system

---

**HealthyAI** - Transforming Healthcare with AI 🤖⚕️