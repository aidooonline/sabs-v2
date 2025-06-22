# Sabs v2 - Scalable Micro-Finance Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.1-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

A complete re-engineering of the micro-finance system with modern, scalable architecture built on **Service-Oriented Architecture (SOA)** and **Event-Driven Design**.

## 🏗️ Architecture Overview

- **Monorepo Structure**: All services and shared libraries in a single repository
- **Service-Oriented Architecture (SOA)**: Decoupled, independent services
- **Event-Driven**: Services communicate via events for loose coupling
- **Multi-Tenant**: Company-level data isolation built-in
- **Cloud-Native**: Designed for Google Cloud Platform deployment

## 📁 Project Structure

```
sabs-v2/
├── packages/
│   ├── services/                 # Microservices
│   │   ├── identity-service/     # Authentication & user management
│   │   ├── company-service/      # Company & tenant management
│   │   ├── accounts-service/     # Customer account management
│   │   ├── transaction-service/  # Transaction processing
│   │   ├── commission-service/   # Commission calculations
│   │   └── notification-service/ # SMS & notifications
│   └── shared/                   # Shared libraries
│       ├── common/               # Common utilities & decorators
│       ├── database/             # Database entities & config
│       └── types/                # TypeScript type definitions
├── docs/                         # Project documentation
├── docker-compose.yml            # Local development environment
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm 9+
- **Docker** and Docker Compose
- **PostgreSQL** 15+ (or use Docker)

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd sabs-v2

# Install dependencies for all packages
npm install

# Copy environment variables
cp .env.example .env
```

### 2. Environment Setup

Edit the `.env` file with your configuration:

```bash
# Update these values for your environment
DB_PASSWORD=your-secure-database-password
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
SMS_PROVIDER_API_KEY=your-sms-provider-key
OPENAI_API_KEY=your-openai-api-key
```

### 3. Start Development Environment

```bash
# Start all services with Docker Compose
docker-compose up -d

# Or start individual services for development
npm run dev --workspace=@sabs/identity-service
npm run dev --workspace=@sabs/company-service
```

### 4. Verify Installation

- **Identity Service**: http://localhost:3001
- **Company Service**: http://localhost:3002
- **Database**: localhost:5432
- **Redis**: localhost:6379

## 🛠️ Development

### Available Scripts

```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Start all services in development mode
npm run dev

# Run tests across all packages
npm run test

# Lint all code
npm run lint

# Format all code
npm run format
```

### Working with Individual Services

```bash
# Navigate to a specific service
cd packages/services/identity-service

# Start development server with hot reload
npm run start:dev

# Run tests for this service only
npm run test

# Build this service
npm run build
```

## 🗄️ Database

### Setup

The database is automatically configured when using Docker Compose. For manual setup:

1. Create PostgreSQL database named `sabs_v2`
2. Update `.env` with your database credentials
3. Run migrations: `npm run migration:run`

### Multi-Tenancy

All entities include `company_id` for automatic tenant isolation:

```typescript
@Entity()
export class Customer extends BaseEntity {
  @Column()
  companyId: string; // Automatic tenant isolation
  
  @Column()
  firstName: string;
  // ... other fields
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `JWT_SECRET` | JWT signing secret | Required |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Identity Service | 3001 | Authentication & users |
| Company Service | 3002 | Company management |
| Accounts Service | 3003 | Customer accounts |
| Transaction Service | 3004 | Transaction processing |
| Commission Service | 3005 | Commission calculations |
| Notification Service | 3006 | SMS & notifications |

## 🔐 Security

- **JWT Authentication**: Secure token-based authentication
- **Multi-Tenant Data Isolation**: Company-level data separation
- **Input Validation**: Comprehensive validation on all endpoints
- **CORS Configuration**: Configurable cross-origin resource sharing

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run end-to-end tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

## 📦 Deployment

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Deployment (GCP)

The project is designed for Google Cloud Platform:

- **Compute**: Cloud Run for services
- **Database**: Cloud SQL (PostgreSQL)
- **Messaging**: Pub/Sub for events
- **Infrastructure**: Terraform for IaC

## 🤝 Contributing

1. **Follow the established patterns**: Use shared types, base entities, and common utilities
2. **Multi-tenancy first**: Always include `companyId` in new entities
3. **Event-driven**: Use events for service communication
4. **Test coverage**: Maintain high test coverage for all services

### Code Standards

- **TypeScript**: Strict typing enforced
- **ESLint + Prettier**: Automatic formatting and linting
- **Conventional Commits**: Use conventional commit messages
- **Pre-commit Hooks**: Husky enforces quality checks

## 📖 Documentation

- [Architecture Overview](./docs/architecture.md)
- [Product Requirements](./docs/prd.md)
- [Project Brief](./docs/project-brief.md)
- [API Documentation](./docs/api/) *(Coming Soon)*

## 🚦 Project Status

✅ **Story 1.1: Initial Project Scaffolding** - COMPLETED
- [x] Monorepo structure with workspaces
- [x] NestJS services scaffolding
- [x] PostgreSQL with TypeORM setup
- [x] Docker development environment
- [x] Code quality standards (ESLint, Prettier, Husky)

🔄 **Next**: Story 1.2 - Cloud Infrastructure Provisioning

## 📞 Support

For questions, issues, or contributions, please refer to the project documentation or contact the development team.

---

**Built with ❤️ for the African FinTech ecosystem**