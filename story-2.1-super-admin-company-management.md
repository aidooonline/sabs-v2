# Story 2.1: Super Admin Company Management & Service Crediting

**Epic:** 2 - Multi-Tenancy, User, & Access Control  
**Story Points:** 8  
**Priority:** High  
**Sprint:** Epic 2 Sprint 1

## 📋 User Story

**As a** Super Admin  
**I want** to manage companies on the platform and allocate service credits  
**So that** I can onboard new agent companies and control their access to billable services (SMS, AI)

## 🎯 Acceptance Criteria

### Company Management
- [ ] **Create new agent companies** with basic details (name, contact, location, subscription plan)
- [ ] **View all companies** in a paginated table with search and filters
- [ ] **Edit company information** including contact details and settings
- [ ] **Activate/deactivate companies** to control platform access
- [ ] **Delete companies** with proper data cleanup (soft delete)
- [ ] **Assign company admin** during company creation

### Service Credit Management
- [ ] **Allocate SMS credits** to companies with expiration dates
- [ ] **Allocate AI credits** (tokens) for AI assistant usage  
- [ ] **View credit usage history** and current balances per company
- [ ] **Set credit alerts** when companies reach low balance thresholds
- [ ] **Generate credit reports** for billing and usage analytics
- [ ] **Credit top-up functionality** for existing companies

### Multi-tenant Security & Compliance
- [ ] **Enforce company data isolation** in all operations
- [ ] **Audit trail** for all super admin actions
- [ ] **Company-level settings** configuration
- [ ] **Role-based access** (only Super Admin can access)

## 🔧 Technical Implementation

### Backend Components
1. **Company Entity & Service**
   - Company CRUD operations with multi-tenant support
   - Company status management (active/inactive)
   - Soft delete functionality

2. **Service Credit System**
   - Credit allocation and tracking
   - Usage monitoring and reporting
   - Credit expiration management
   - Alert system for low balances

3. **Audit & Security**
   - Comprehensive audit logging
   - Super Admin role enforcement
   - Data validation and sanitization

### Frontend Components
1. **Company Management Dashboard**
   - Paginated company table with search/filters
   - Company creation and edit forms
   - Bulk operations (activate/deactivate)

2. **Credit Management Interface**
   - Credit allocation forms
   - Usage analytics dashboards
   - Credit history and reporting

3. **Navigation & Access Control**
   - Super Admin menu integration
   - Role-based component rendering
   - Responsive design for all devices

## 📊 Definition of Done

- [ ] All acceptance criteria implemented and tested
- [ ] Multi-tenant data isolation verified
- [ ] Role-based access control enforced
- [ ] Comprehensive audit logging implemented
- [ ] Frontend responsive on mobile and desktop
- [ ] API documentation updated
- [ ] Unit tests written for all services
- [ ] Integration tests for end-to-end workflows
- [ ] Performance meets <200ms requirements
- [ ] Security review completed

## 🚀 Business Value

### For Super Admins
- Complete control over platform companies
- Real-time visibility into service usage
- Automated billing and credit management
- Audit trail for compliance

### For Platform Operations
- Scalable multi-tenant architecture
- Automated service credit tracking
- Revenue monitoring and reporting
- Compliance and security enforcement

## 📈 Success Metrics

- Companies can be created and managed efficiently
- Service credits are accurately tracked and reported
- Multi-tenant data isolation is maintained
- All operations complete within performance targets
- Audit trails capture all administrative actions

---

**Implementation Timeline:** 3-5 days  
**Dependencies:** Epic 1 (Platform Foundation) - Complete  
**Risk Level:** Medium (Multi-tenant complexity)  
**Next Story:** Story 2.2 - Staff Management by Company Admin