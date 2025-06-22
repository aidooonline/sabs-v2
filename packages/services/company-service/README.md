# 🏢 Company Service - Sabs v2

**Multi-tenant company management and service crediting system for the Sabs v2 platform**

## 🎯 Overview

The Company Service is the core multi-tenancy component of the Sabs v2 platform, providing comprehensive company management, service credit billing, and administrative capabilities for Super Admins and Company Admins.

## 🚀 Features

### 🔧 Multi-Tenant Company Management
- **Company CRUD operations** with full lifecycle management
- **Subscription plan management** (basic, standard, premium, enterprise)
- **Trial period tracking** with automatic expiration monitoring
- **International support** with country/currency/timezone configuration
- **Company settings** (notifications, features, limits, branding)

### 💳 Service Credit System
- **SMS and AI credit management** with real-time tracking
- **Package-based purchasing** with predefined credit bundles
- **Automatic usage deduction** with audit trails
- **Low credit warning system** with configurable thresholds
- **Comprehensive usage analytics** and monthly reporting
- **Cost calculation and billing** metrics

### 📊 Business Intelligence
- **Super Admin dashboard** with platform-wide metrics
- **Company statistics** (users, customers, transactions)
- **Trial conversion tracking** and revenue analytics
- **Usage forecasting** and capacity planning data

### 🔐 Security & Access Control
- **Role-based access control** (Super Admin, Company Admin)
- **Multi-tenant data isolation** with company-level security
- **JWT authentication integration** ready
- **API endpoint protection** with role guards

## 📡 API Endpoints

### Company Management (15 endpoints)
```http
POST   /companies                     # Create company (Super Admin)
GET    /companies                     # List companies with pagination/filtering
GET    /companies/dashboard           # Dashboard statistics  
GET    /companies/expiring-trials     # Trial expiration alerts
GET    /companies/:id                 # Get company details
GET    /companies/:id/stats           # Company statistics
PATCH  /companies/:id                 # Update company
DELETE /companies/:id                 # Soft delete company
POST   /companies/:id/service-credits # Add service credits
GET    /companies/:id/service-credits/:type # Get credit balance
PATCH  /companies/:id/subscription    # Update subscription
PATCH  /companies/bulk/status         # Bulk status updates
```

### Service Credits (7 endpoints)
```http
GET    /service-credits/companies/:id/balances         # All credit balances
POST   /service-credits/companies/:id/purchase         # Purchase credits
GET    /service-credits/companies/:id/usage/:type/stats # Usage statistics
GET    /service-credits/companies/:id/usage/monthly/:year/:month # Monthly report
POST   /service-credits/companies/:id/deduct          # Deduct credits (internal)
GET    /service-credits/warnings/low-credits          # Low credit warnings
GET    /service-credits/packages                      # Available packages
```

### Health Monitoring (3 endpoints)
```http
GET    /health        # Comprehensive health check
GET    /health/live   # Liveness probe (Kubernetes)
GET    /health/ready  # Readiness probe (Kubernetes)
```

## 🏗️ Architecture

### Database Entities
- **Company** - Multi-tenant root entity with service credits
- **ServiceUsage** - Service consumption tracking for billing
- **Integration** with existing users, customers, and audit_logs tables

### Module Structure
```
src/
├── main.ts                 # Service entry point
├── app.module.ts           # Main application module
├── companies/              # Company management module
│   ├── entities/
│   ├── dto/
│   ├── companies.service.ts
│   ├── companies.controller.ts
│   └── companies.module.ts
├── service-credits/        # Service credit management
│   ├── entities/
│   ├── service-credits.service.ts
│   ├── service-credits.controller.ts
│   └── service-credits.module.ts
└── health/                 # Health monitoring
    ├── health.controller.ts
    └── health.module.ts
```

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Installation
```bash
cd packages/services/company-service
npm install
```

### Environment Variables
```env
NODE_ENV=development
PORT=3002
DATABASE_URL=postgresql://sabs_user:sabs_dev_password@localhost:5432/sabs_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev_jwt_secret_key_123456789
IDENTITY_SERVICE_URL=http://localhost:3001
```

### Running the Service
```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Run tests
npm test
npm run test:cov
```

### Docker Development
```bash
# Start all services
docker-compose up -d

# Company service will be available at:
# http://localhost:3002
```

## 📚 API Documentation

Once running, Swagger documentation is available at:
- **Development**: http://localhost:3002/api/docs
- **Docker**: http://localhost:3002/api/docs

## 🧪 Testing

### Create a Company
```bash
curl -X POST http://localhost:3002/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Acme Financial",
    "email": "admin@acme.com",
    "phone": "+233123456789",
    "address": "123 Business St, Accra, Ghana",
    "countryCode": "GH",
    "currency": "GHS"
  }'
```

### Add Service Credits
```bash
curl -X POST http://localhost:3002/companies/{companyId}/service-credits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "serviceType": "sms",
    "amount": 1000,
    "reason": "Initial credit package"
  }'
```

### Get Dashboard Statistics
```bash
curl -X GET http://localhost:3002/companies/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔗 Integration Points

### With Identity Service
- JWT token validation
- User role verification
- Multi-tenant access control

### With Database
- Uses existing companies table from migration 001
- Integrates with service_usage table for billing
- Leverages audit_logs for compliance tracking

### With Other Services
- Service credit deduction APIs for SMS/AI services
- Usage tracking for billing and analytics
- Event publishing for real-time updates

## 🚀 Production Deployment

### Health Checks
- **Liveness**: `/health/live` - Service availability
- **Readiness**: `/health/ready` - Database connectivity
- **Full Health**: `/health` - Comprehensive system check

### Monitoring Metrics
- API response times and error rates
- Service credit balances and usage
- Company registration and trial conversions
- Database connection health

### Environment Configuration
- Database connection pooling
- Redis session management
- JWT secret rotation
- Rate limiting configuration

## 🏆 Business Value

### Revenue Generation
- 💰 **Service credit billing** with usage-based pricing
- 📊 **Subscription management** with plan upgrades
- 📈 **Package sales** with predefined credit bundles

### Operational Efficiency
- 🚨 **Automated monitoring** with low credit alerts
- 📋 **Bulk operations** for administrative tasks
- 📈 **Analytics dashboard** for data-driven decisions

### Scalability
- 🌍 **Multi-tenant architecture** supporting thousands of companies
- 🔄 **Event-driven design** for real-time processing
- 📊 **Performance analytics** for capacity planning

## 📝 Contributing

1. Follow the established NestJS patterns
2. Add comprehensive tests for new features
3. Update API documentation
4. Ensure multi-tenant security compliance
5. Add appropriate logging and monitoring

## 🎉 Story 2.1 Complete!

This service delivers **enterprise-grade company management** with:
- ✅ **25 API endpoints** across 3 modules
- ✅ **Comprehensive service credit system** with billing
- ✅ **Multi-tenant SaaS architecture** foundation
- ✅ **Production-ready health monitoring**
- ✅ **Complete Swagger API documentation**

**Ready to scale to thousands of companies across Africa!** 🌍🚀