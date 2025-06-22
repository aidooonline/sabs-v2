# Sabs v2 Data Migration Tools

## Overview

This directory contains a comprehensive suite of tools for migrating data from the legacy Sabs system to the new Sabs v2 platform. The migration framework is designed to ensure data integrity, zero-downtime transition, and robust error handling.

## Architecture

The migration system follows a four-phase approach:

1. **📤 Extraction**: Extract data from legacy MySQL database
2. **🔄 Transformation**: Transform and map legacy data to Sabs v2 format  
3. **📥 Loading**: Load transformed data into Sabs v2 PostgreSQL database
4. **✅ Validation**: Comprehensive validation and integrity checks

## Tools Overview

### 1. Migration Orchestrator (`migrate.ts`)
**Main entry point** - Coordinates the entire migration process

```bash
# Run complete migration
npm run migration:full

# Run individual phases
npm run migration:extract
npm run migration:transform  
npm run migration:load
npm run migration:validate

# Dry run (simulation)
npm run migration:dry-run
```

### 2. Legacy Data Extractor (`legacy-extractor.ts`)
Extracts data from legacy MySQL database with batching and validation

**Features:**
- Batch processing for large datasets
- Data integrity verification with checksums
- Comprehensive error handling
- Progress tracking and reporting

**Usage:**
```bash
ts-node scripts/data-migration/legacy-extractor.ts extract
ts-node scripts/data-migration/legacy-extractor.ts validate
```

### 3. Data Transformer (`data-transformer.ts`)
Transforms legacy data to Sabs v2 format with ID mapping and validation

**Features:**
- Legacy integer ID to UUID mapping
- Data cleansing and validation
- Business rule application
- Password re-hashing for security

**Usage:**
```bash
ts-node scripts/data-migration/data-transformer.ts transform
ts-node scripts/data-migration/data-transformer.ts validate
```

### 4. Data Loader (`data-loader.ts`)
Loads transformed data into Sabs v2 database with transaction safety

**Features:**
- Batch processing with transactions
- Upsert operations (INSERT ... ON CONFLICT)
- Referential integrity validation
- Backup and restore capabilities

**Usage:**
```bash
ts-node scripts/data-migration/data-loader.ts load
ts-node scripts/data-migration/data-loader.ts validate
ts-node scripts/data-migration/data-loader.ts backup
```

### 5. Migration Runner (`migration-runner.ts`)
Manages database schema migrations with integrity checking

**Features:**
- Sequential migration execution
- Checksum-based integrity verification
- Rollback capability
- Migration history tracking

## Quick Start

### Prerequisites

1. **Legacy Database Access**: MySQL connection to legacy Sabs system
2. **New Database**: PostgreSQL connection to Sabs v2 system  
3. **Node.js**: Version 18+ with TypeScript support
4. **Dependencies**: Install with `npm install`

### Environment Setup

Create a `.env` file in the project root:

```bash
# Legacy Database (Source)
LEGACY_DB_HOST=localhost
LEGACY_DB_PORT=3306
LEGACY_DB_USER=sabs_user
LEGACY_DB_PASSWORD=sabs_password
LEGACY_DB_NAME=sabs_legacy

# New Database (Target)
DATABASE_URL=postgresql://postgres:password@localhost:5432/sabs_v2

# Migration Settings
OUTPUT_DIR=./data-migration
BATCH_SIZE=1000
```

### Testing with Sample Data

Start the legacy database with sample data:

```bash
# Start legacy MySQL with sample data
docker-compose --profile migration up legacy-db -d

# Verify connection
mysql -h localhost -P 3306 -u sabs_user -psabs_password sabs_legacy -e "SELECT COUNT(*) FROM companies;"
```

### Running Migration

#### 1. Complete Migration (Recommended)
```bash
npm run migration:full
```

#### 2. Step-by-Step Migration
```bash
# Step 1: Run schema migrations
npm run migration:create

# Step 2: Extract legacy data
npm run migration:extract

# Step 3: Transform data
npm run migration:transform

# Step 4: Load into new system
npm run migration:load

# Step 5: Validate results
npm run migration:validate
```

#### 3. Dry Run (Testing)
```bash
npm run migration:dry-run
```

### Advanced Usage

#### Custom Configuration
```bash
ts-node scripts/data-migration/migrate.ts full \
  --batch-size=500 \
  --working-dir=./custom-migration \
  --skip-extraction
```

#### Individual Tool Usage
```bash
# Extract specific data
LEGACY_DB_HOST=prod.mysql.com ts-node scripts/data-migration/legacy-extractor.ts extract

# Transform with custom mapping
INPUT_DIR=./extracted OUTPUT_DIR=./transformed ts-node scripts/data-migration/data-transformer.ts transform

# Load with validation
DATABASE_URL=postgresql://prod.db.com/sabs_v2 ts-node scripts/data-migration/data-loader.ts load
```

## Data Mapping

### Entity Transformations

#### Companies
- `id` (int) → `id` (UUID)
- `company_name` → `name`
- `status` (int) → `status` (enum: active/inactive/suspended/trial)
- Add defaults: `country_code='GH'`, `currency='GHS'`, `timezone='Africa/Accra'`

#### Users  
- `id` (int) → `id` (UUID)
- `company_id` (int) → `company_id` (UUID, mapped)
- `name` → `first_name` + `last_name` (split)
- `password` → `password_hash` (re-hashed with bcrypt)
- `role` (string) → `role` (enum: super_admin/company_admin/clerk/field_agent)

#### Customers
- `id` (int) → `id` (UUID)
- `company_id` (int) → `company_id` (UUID, mapped)
- `created_by` (int) → `created_by_agent_id` (UUID, mapped)
- Add defaults: `kyc_status='pending'`, `account_status='active'`

#### Transactions
- `id` (int) → `id` (UUID)
- `company_id` (int) → `company_id` (UUID, mapped)
- `customer_id` (int) → `customer_id` (UUID, mapped)
- `agent_id` (int) → `agent_id` (UUID, mapped)
- `transaction_type` → `type` (mapped: credit→deposit, debit→withdrawal)
- `status` → `status` (mapped: successful→completed, processing→pending)

## Validation & Quality Assurance

### Pre-Migration Validation
- ✅ Data completeness checks
- ✅ Referential integrity validation
- ✅ Business rule compliance
- ✅ Data format validation

### Post-Migration Validation
- ✅ Record count verification
- ✅ Data integrity checks
- ✅ Foreign key constraint validation
- ✅ Business logic verification

### Error Handling
- Comprehensive error logging
- Failed record tracking
- Rollback capabilities
- Detailed error reports

## Monitoring & Reporting

### Progress Tracking
- Real-time progress indicators
- Phase completion status
- Record processing counts
- Error and success rates

### Reports Generated
- `extraction-manifest.json` - Extraction summary
- `transformation-manifest.json` - Transformation summary  
- `load-manifest.json` - Loading summary
- `migration-report.json` - Complete migration report
- `id-mappings.json` - Legacy ID to UUID mappings

### Key Metrics
- **Extraction**: Records extracted, validation errors
- **Transformation**: Input/output records, mapping errors
- **Loading**: Records loaded, failed records, integrity checks
- **Performance**: Execution times, throughput rates

## Troubleshooting

### Common Issues

#### 1. Connection Errors
```bash
# Test legacy database connection
mysql -h $LEGACY_DB_HOST -P $LEGACY_DB_PORT -u $LEGACY_DB_USER -p$LEGACY_DB_PASSWORD $LEGACY_DB_NAME

# Test new database connection  
psql $DATABASE_URL -c "SELECT version();"
```

#### 2. Memory Issues with Large Datasets
```bash
# Reduce batch size
ts-node scripts/data-migration/migrate.ts full --batch-size=100

# Process in phases
npm run migration:extract
npm run migration:transform  
npm run migration:load
```

#### 3. Data Validation Failures
```bash
# Run validation only
npm run migration:validate

# Check specific validation reports
cat ./data-migration/transformation-manifest.json | jq '.results[].errors'
```

#### 4. Rollback Procedures
```bash
# Create backup before migration
ts-node scripts/data-migration/data-loader.ts backup pre-migration-backup

# Restore from backup if needed
ts-node scripts/data-migration/data-loader.ts restore pre-migration-backup.sql
```

### Debug Mode
```bash
# Enable detailed logging
DEBUG=migration:* npm run migration:full

# Dry run for testing
npm run migration:dry-run
```

## Performance Optimization

### Batch Size Tuning
```bash
# Small datasets (< 10K records)
--batch-size=1000

# Medium datasets (10K - 100K records)  
--batch-size=500

# Large datasets (> 100K records)
--batch-size=100
```

### Database Optimization
```sql
-- Temporarily disable constraints during loading
SET foreign_key_checks = 0;  -- MySQL
SET session_replication_role = replica;  -- PostgreSQL

-- Re-enable after loading
SET foreign_key_checks = 1;  -- MySQL  
SET session_replication_role = DEFAULT;  -- PostgreSQL
```

## Security Considerations

### Data Protection
- ✅ Password re-hashing during migration
- ✅ Sensitive data masking in logs
- ✅ Encrypted database connections
- ✅ Audit trail preservation

### Access Control
- Principle of least privilege
- Separate credentials for migration
- Time-limited access tokens
- Network security (VPN/firewall)

## Production Deployment

### Pre-Migration Checklist
- [ ] Legacy database backup created
- [ ] New database backup created  
- [ ] Migration scripts tested in staging
- [ ] Stakeholder communication sent
- [ ] Maintenance window scheduled
- [ ] Rollback plan prepared

### Migration Day Process
1. **T-2 hours**: Final testing and prep
2. **T-1 hour**: Enable maintenance mode
3. **T-0**: Begin migration execution
4. **T+4 hours**: Complete validation
5. **T+6 hours**: Switch traffic to new system

### Post-Migration Tasks
- [ ] Performance monitoring
- [ ] User acceptance testing
- [ ] Legacy system decommission
- [ ] Documentation updates
- [ ] Team retrospective

## Support & Maintenance

### Monitoring Commands
```bash
# Check migration status
npm run migration:validate

# View migration reports
cat ./data-migration/migration-report.json | jq '.summary'

# Monitor database performance
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"
```

### Log Locations
- Migration logs: `./data-migration/logs/`
- Error reports: `./data-migration/*-manifest.json`
- Database logs: Check PostgreSQL/MySQL logs

### Contact Information
- **Migration Lead**: [Name] - [email]
- **Database Team**: [email]
- **DevOps Team**: [email]
- **Emergency Contact**: [phone]

---

## Migration Success Criteria

### Technical Success ✅
- 100% data extraction from legacy system
- \> 99.9% successful data transformation
- \> 99.9% successful data loading
- All validation checks pass
- Performance meets SLA requirements
- Zero data loss or corruption

### Business Success ✅  
- < 4 hours total downtime
- All users can access new system
- All transactions process correctly
- No impact on customer operations
- Audit trail preserved
- Compliance requirements met

---

**📝 Last Updated**: January 2024  
**🔧 Version**: 1.0.0  
**👥 Maintained by**: Sabs v2 Development Team