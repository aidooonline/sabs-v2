# sabs v2 Architecture Document

## Introduction / Preamble

This document outlines the overall project architecture for the new **sabs v2** platform, including backend systems, shared services, and non-UI specific concerns. Its primary goal is to serve as the guiding architectural blueprint for AI-driven development, ensuring consistency and adherence to chosen patterns and technologies.

## Technical Summary
The project is to architect and build a modern, multi-tenant, cloud-native SaaS platform for micro-finance operations. The architecture is explicitly designed to be decoupled, scalable, and maintainable, addressing the limitations of the legacy application. It will run on the **Google Cloud Platform** and feature a configurable, event-driven design.

## High-Level Overview
The system will be built using a **Service-Oriented Architecture (SOA)** composed of decoupled services running on Google Cloud Run and communicating via an event bus (Google Pub/Sub). The entire codebase will be managed in a single **Monorepo**.

## Architectural / Design Patterns Adopted
* **Service-Oriented Architecture (SOA):** To break the monolith into independent services.
* **Event-Driven Architecture:** To ensure services are loosely coupled.
* **Repository Pattern:** To abstract data access logic from business logic.
* **CQRS (Command Query Responsibility Segregation):** For fast and efficient dashboard reporting.

## Component View
The system is broken down into logical services:
* **Identity Service**
* **Company & Plan Service**
* **Accounts Service**
* **Transaction Service**
* **Deduction & Commission Engine**
* **Reporting Service**
* **Notification Service**
* **Loan Service**
* **AIService**

## Project Structure
A monorepo will be used to manage all services and shared libraries in a `packages/` directory.

## Definitive Tech Stack Selections
| Category                  | Technology                    |
| :------------------------ | :---------------------------- |
| **Cloud Platform** | Google Cloud Platform (GCP)   |
| **Compute** | Google Cloud Run              |
| **Database** | Google Cloud SQL (PostgreSQL) |
| **Messaging** | Google Pub/Sub                |
| **Languages & Runtime** | TypeScript on Node.js         |
| **Backend Framework** | NestJS                        |
| **Infrastructure as Code**| Terraform                     |
| **CI/CD** | GitHub Actions                |

## Infrastructure and Deployment
Infrastructure is managed via Terraform. A GitHub Actions pipeline will test all PRs and automatically deploy successful merges to the `dev` environment, with manual approvals required for `staging` and `production`.

## Core Standards (Coding, Testing, Security)
* **Coding:** All code will be strictly typed with TypeScript and formatted with Prettier.
* **Testing:** A multi-layered strategy will be used: Unit (Jest), Integration, and End-to-End (Playwright) tests.
* **Security:** Authentication will use JWTs, authorization will be enforced via middleware, and secrets will be managed in Google Secret Manager. The Platform Master Key will be implemented for ultimate administrative control.