# sabs v2: Product Requirements Document (PRD)

## Epic 1: Platform Foundation & Migration Readiness
* **Goal:** To build the repository, provision the cloud infrastructure, establish a CI/CD pipeline, plan the data migration, and set up observability to create a solid foundation for the entire platform.

**Stories:**
* **Story 1.1: Initial Project Scaffolding**
* **Story 1.2: Cloud Infrastructure Provisioning**
* **Story 1.3: Basic CI/CD Pipeline**
* **Story 1.4: Data Migration Strategy & Tooling**
* **Story 1.5: Core Observability Setup**
* **Story 1.6: Local Development Environment Setup**
* **Story 1.7: Onboard and Configure Third-Party Services**
* **Story 1.8: Implement Platform Master Key Mechanism**

## Epic 2: Multi-Tenancy, User, & Access Control
* **Goal:** To build the core systems that manage who can use the platform (companies and users) and what they are allowed to do (roles and permissions).

**Stories:**
* **Story 2.1: Super Admin Company Management & Service Crediting**
* **Story 2.2: Staff Management by Company Admin**
* **Story 2.3: Secure User Authentication**
* **Story 2.4: Role-Based Access Control (RBAC) Enforcement**

## Epic 3: Core Transaction Engine
* **Goal:** To build all the essential financial operations, including customer onboarding and the secure, multi-step withdrawal workflow.

**Stories:**
* **Story 3.1: Customer Onboarding & Account Creation by Agent**
* **Story 3.2: Withdrawal Request Submission by Agent**
* **Story 3.3: Withdrawal Approval by Clerk/Admin**
* **Story 3.4: Secure Payout Execution by Agent**
* **Story 3.5: Transaction Reversal by Admin/Clerk**
* **Story 3.6: Clerk-Agent Cash Reconciliation**
* **Story 3.7: Transaction Receipt Printing**

## Epic 4: Agent Empowerment & Commercialization
* **Goal:** To create the systems that motivate agents (commissions) and allow for the management of billable services.

**Stories:**
* **Story 4.1: Commission Rule Configuration**
* **Story 4.2: Real-time Commission Calculation & Reporting**
* **Story 4.3: Service Credit Management & Auditing**
* **Story 4.4: Automated Service Credit Deduction**
* **Story 4.5: Custom Transaction Message Management**
* **Story 4.6: Scheduled Monthly Deductions**
* **Story 4.7: Company Self-Service Package Subscription**

## Epic 5: Customer Omnichannel MVP
* **Goal:** To build the simple, customer-facing interfaces that allow users to interact with their accounts across different channels.

**Stories:**
* **Story 5.1: USSD Customer Interface**
* **Story 5.2: Simple Web Portal for Customers**
* **Story 5.3: Simple Android App for Customers**

## Epic 6: Loan & AI Engine MVP
* **Goal:** To build the advanced, value-added services for loans and AI-powered intelligence.

**Stories:**
* **Story 6.1: Loan Product Configuration**
* **Story 6.2: AI-Powered Credit Scoring**
* **Story 6.3: Loan Application & Approval Workflow**
* **Story 6.4: Loan Disbursement & Repayment Tracking**
* **Story 6.5: AI-Powered Fraud Detection**
* **Story 6.6: Core AI Assistant for Staff**