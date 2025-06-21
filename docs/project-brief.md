
### **FINAL DOCUMENT**

# Project Brief: Sabs (v2)

## Introduction / Problem Statement

[cite_start]The project is a complete re-engineering of an existing micro-finance system currently operating in Ghana. [cite: 1] [cite_start]The current system, which consists of a web app, a React Native Expo mobile app, and a Laravel API, has successfully served a small group of field agents but is now facing significant **performance, maintainability, and infrastructure challenges**. [cite: 1, 2] [cite_start]Key issues include system slowdowns due to unoptimized queries and infrastructure strain, [cite: 2] [cite_start]code complexity hindering further development, [cite: 2] [cite_start]dependency management issues on the mobile client, [cite: 2] [cite_start]and security vulnerabilities on the current hosting platform. [cite: 3]

This project aims to solve these problems by building a new, decoupled, and highly scalable platform from the ground up. [cite_start]The goal is to provide a robust foundation that supports massive user growth, improves agent efficiency, enhances security, and allows for the rapid development of future financial products like loans and insurance. [cite: 1, 5]

## Vision & Goals

* **Vision:** To create a scalable, secure, and resilient **Platform-as-a-Service (PaaS)** for the FinTech industry. [cite_start]This platform will empower field agents and their companies across Africa with robust tools for micro-finance, while providing ongoing value through billable, integrated services like SMS and a sophisticated AI Assistant. [cite: 5, 6, 7]

* **Primary Goals (for the Sabs v2 MVP):**
    1.  [cite_start]**Re-platform for Scale & Stability:** Successfully build and migrate core functionality to a new, decoupled, cloud-native architecture, completely resolving the performance, security, and maintainability issues of the old system. [cite: 1, 2, 3]
    2.  [cite_start]**Enhance Agent Efficiency:** Implement the "Dynamic Commission Engine," ensure rock-solid, reliable Bluetooth printing, and deliver a fast, responsive UI. [cite: 3]
    3.  [cite_start]**Launch Core Customer & Loan Services:** Deliver the initial customer-facing USSD features and launch the first version of the urgently needed `LoanService`. [cite: 4, 8]
    4.  [cite_start]**Enable Multi-Company Operations:** Establish the secure multi-tenant architecture required to safely onboard and manage multiple, separate agent companies. [cite: 8, 9]
    5.  [cite_start]**Implement a Multi-Tenant Credit System:** Deliver a system to meter, manage, and bill companies for their usage of platform services, starting with SMS and AI token usage. [cite: 7]
    6.  [cite_start]**Deliver an Integrated AI Assistant:** Launch a role-aware AI Assistant that provides business intelligence and operational support for both agents and administrators, with secure, permission-based access to data. [cite: 6, 7]

* **Success Metrics (Initial Ideas):**
    * [cite_start]**Performance:** Average API response time for critical transactions should be under 200ms. [cite: 10]
    * [cite_start]**Reliability:** Achieve 99.9%+ uptime and eliminate all instances of critical errors like double-transactions. [cite: 3]
    * [cite_start]**Agent Adoption:** All existing agents are successfully transitioned to Sabs (v2) with positive feedback on speed and usability. [cite: 3]
    * [cite_start]**Customer Engagement:** Track the number of successful USSD transactions per week post-launch. [cite: 4]
    * [cite_start]**Business Growth:** Successfully onboard one new agent company. [cite: 9] [cite_start]Successfully issue and manage the first set of loans through the new system. [cite: 8]
    * [cite_start]**Commercial Adoption:** See the first new company successfully purchase and utilize SMS or AI credit bundles. [cite: 7]
    * [cite_start]**AI Value:** Track the number of queries made to the AI assistant, indicating its usage and value. [cite: 6]

## Target Audience / Users

### Field Agent
[cite_start]The primary, day-to-day users of the system. [cite: 1] [cite_start]They operate in the field (initially in Ghana) using the mobile and web apps to serve customers. [cite: 1] [cite_start]Their main goals are to efficiently sign up new customers, process deposits and withdrawals quickly and without errors, and track their commissions. [cite: 1, 8]

### The Clerk / Teller
[cite_start]This user is responsible for the physical cash management with the Field Agents. [cite: 11] [cite_start]They will use a dedicated interface (likely on the web app) to record cash received from agents (daily collections) and cash issued to agents (daily float). [cite: 11] [cite_start]A key part of their role is using the system to perform reconciliation, ensuring an agent's reported electronic transactions match the physical cash being exchanged. [cite: 11]

### Company Admin
[cite_start]The owner or manager of an "Agent Company" that uses the Sabs platform. [cite: 8] This user needs to oversee their own group of Field Agents and Clerks. [cite_start]Their goals are to monitor their company's overall performance, manage their agents, view financial reports, and handle administrative tasks specific to their own business. [cite: 9] [cite_start]They will be the primary customer for the billable SMS and AI credit services. [cite: 7]

### Super Admin
This is the ultimate platform owner. [cite_start]This role has the highest level of privilege, with a complete overview of all companies and agents operating on the system. [cite: 7] [cite_start]The Super Admin is responsible for configuring system-wide settings, such as switching the underlying AI model provider, and overseeing the health and security of the entire Sabs (v2) ecosystem. [cite: 7]

### End-Customer
The foundation of the entire ecosystem. [cite_start]Their direct interaction with the system is through accessible channels (USSD, a simple web portal, and a simple Android app). [cite: 5] [cite_start]Their primary goals are to have a simple, reliable way to check their balance, and to initiate deposits and withdrawals. [cite: 4, 5]

## Key Features / Scope (MVP)

### Platform Core & Architecture
* [cite_start]**Decoupled & Scalable Backend:** A complete re-architecture of the system into a service-oriented, event-driven model built on a secure cloud platform to solve all current performance, stability, and security issues. [cite: 1, 2, 3]
* [cite_start]**Multi-Tenant Foundation:** The system must support multiple, separate agent companies, with iron-clad data isolation enforced by a `company_id` on all relevant data. [cite: 9]
* [cite_start]**Modular Service Integration:** Design the system to allow for plug-and-play third-party services, starting with a modular `NotificationService` for different SMS providers. [cite: 4]
* [cite_start]**Data Migration:** A plan and scripts to migrate all existing data from the old system to the new, optimized database schema. [cite: 10]

### Super Admin Features
* [cite_start]**System-Wide Oversight:** A dashboard to monitor the health and activity of all companies on the platform. [cite: 7]
* [cite_start]**Service Configuration:** An interface to manage billable services, including the ability to switch the underlying AI model provider for the AI Assistant. [cite: 7]

### Company Admin & Clerk Features
* **Staff Management:** Admins can manage their roster of Field Agents and Clerks.
* [cite_start]**Clerk Cash Management:** A dedicated interface for Clerks to manage float issuance to agents and receive their end-of-day collections. [cite: 11]
* [cite_start]**Reconciliation Tool:** A feature for Clerks to check and verify an agent's electronic transaction records against their physical cash deposits. [cite: 11]
* [cite_start]**Billable Services Management:** Admins can view and manage their company's usage and credits for SMS and AI services. [cite: 7]

### Field Agent Features
* [cite_start]**Optimized Transaction App:** A fast and reliable mobile (Android) and web application for processing customer transactions (deposits, withdrawals). [cite: 1, 3]
* [cite_start]**Error-Proof Transactions:** The app UI and backend must prevent double-submission of transactions. [cite: 3]
* [cite_start]**Reliable Receipt Printing:** Stable and consistent integration with portable Bluetooth printers. [cite: 1, 3]
* [cite_start]**Dynamic Commission Engine:** A system for agents to see and track their commissions based on rules configured by their Company Admin. [cite: 3]
* [cite_start]**GPS Location Tracking:** To monitor agent movements and improve accountability. [cite: 8]

### End-Customer Features
* [cite_start]**Omnichannel Access:** A simple and consistent experience for customers to check balances, make deposits, and initiate withdrawals via three channels: USSD, a basic Web Portal, and a basic Android App. [cite: 4, 5]

### New Services & Engines (MVP)
* [cite_start]**Loan Service (MVP):** The initial version of the integrated system to offer and manage loans. [cite: 8]
* **AI-Powered Engine (MVP):** The first implementation of the AI engine will include:
    * [cite_start]⚠️ **Fraud Detection & Risk Alerts:** To flag unusual transactions and geo-location mismatches. [cite: 12]
    * [cite_start]📊 **Credit Scoring & Lending AI:** To generate dynamic credit scores to support the new Loan Service. [cite: 12]
    * [cite_start]🧠 **AI Assistant (Core):** A role-aware chat assistant for agents and admins to answer FAQs and get basic performance insights. [cite: 6, 7, 12]

## Post MVP Features / Scope and Ideas

### The Full AI Engine Rollout
* [cite_start]**Advanced Financial Insights:** AI-based cash flow forecasts, profit margin tips, and business pattern detection. [cite: 12]
* [cite_start]**Automated Reconciliation:** AI suggestions to automatically flag and help fix mismatched or duplicate transactions. [cite: 12]
* [cite_start]**Customer & Agent Profiling:** Automatically segmenting agents and customers based on behavior. [cite: 12]
* [cite_start]**Smart Messaging:** Personalized, automated performance reports and reminders for agents via WhatsApp or in-app notifications. [cite: 12]
* [cite_start]**Voice-to-Transaction:** Allowing agents to perform core transactions using voice commands. [cite: 12]
* [cite_start]**Agent Development Suite:** Including AI-powered agent performance monitoring and micro-coaching. [cite: 12]
* [cite_start]**Float-as-a-Service:** A predictive system to manage and automatically issue agent float. [cite: 12]

### Platform & Product Expansion
* [cite_start]**Launch New Financial Products:** Following the Loan Service, the next major product to be introduced will be **Micro-Insurance**. [cite: 5]
* [cite_start]**Geographic Expansion:** Actively launch and support operations in **Nigeria** and other African countries, enabling new currencies and adapting to local regulations. [cite: 5]
* [cite_start]**Full-Featured Customer Portals:** Evolve the simple MVP web and mobile portals into full-featured applications. [cite: 5]

## Known Technical Constraints or Preferences

* [cite_start]**Infrastructure:** The system must be migrated off the current Namecheap cPanel hosting to a professional, secure cloud platform (e.g., AWS, GCP, Azure) capable of handling the security and performance requirements. [cite: 2, 3]
* [cite_start]**Architecture:** The design must be a decoupled, service-oriented, and event-driven architecture to meet scalability and maintainability goals. [cite: 1, 10]
* [cite_start]**Flexibility:** The system requires a model-agnostic layer for the AI Assistant and a modular design for the SMS Notification service to avoid vendor lock-in. [cite: 4, 7]
* [cite_start]**Internationalization:** The architecture must support multiple currencies (starting with GHS and NGN) and multiple languages from day one. [cite: 5]

## Relevant Research

* [cite_start]**MTN Ghana USSD Documentation:** `https://developers.mtn.com/products/ussd` [cite: 5]

## PM Prompt

This Project Brief provides the full context for Sabs (v2). Please start in 'PRD Generation Mode', review the brief thoroughly to work with the user to create the PRD section by section 1 at a time, asking for any necessary clarification or suggesting improvements as your mode 1 programming allows.

---
