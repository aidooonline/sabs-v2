# Project Information
output "project_id" {
  description = "The GCP project ID"
  value       = var.project_id
}

output "region" {
  description = "The GCP region"
  value       = var.region
}

output "environment" {
  description = "The deployment environment"
  value       = var.environment
}

# Network Outputs  
output "vpc_network_id" {
  description = "The ID of the VPC network"
  value       = google_compute_network.main.id
}

output "vpc_network_name" {
  description = "The name of the VPC network"
  value       = google_compute_network.main.name
}

output "subnet_id" {
  description = "The ID of the main subnet"
  value       = google_compute_subnetwork.main.id
}

output "vpc_connector_id" {
  description = "The ID of the VPC Access Connector"
  value       = google_vpc_access_connector.main.id
}

# Database Outputs
output "database_instance_name" {
  description = "The name of the Cloud SQL instance"
  value       = google_sql_database_instance.main.name
}

output "database_connection_name" {
  description = "The connection name of the Cloud SQL instance"
  value       = google_sql_database_instance.main.connection_name
}

output "database_private_ip" {
  description = "The private IP address of the Cloud SQL instance"
  value       = google_sql_database_instance.main.private_ip_address
  sensitive   = true
}

output "database_name" {
  description = "The name of the database"
  value       = google_sql_database.sabs_v2.name
}

# Cloud Run Services
output "identity_service_url" {
  description = "The URL of the Identity Service"
  value       = google_cloud_run_v2_service.identity_service.uri
}

output "company_service_url" {
  description = "The URL of the Company Service"
  value       = google_cloud_run_v2_service.company_service.uri
}

output "identity_service_name" {
  description = "The name of the Identity Service"
  value       = google_cloud_run_v2_service.identity_service.name
}

output "company_service_name" {
  description = "The name of the Company Service"
  value       = google_cloud_run_v2_service.company_service.name
}

# Load Balancer and Domain
output "global_ip_address" {
  description = "The global IP address for the load balancer"
  value       = google_compute_global_address.main.address
}

output "domain_name" {
  description = "The domain name for the application"
  value       = var.domain_name
}

output "load_balancer_url" {
  description = "The HTTPS URL for the load balancer"
  value       = "https://${var.domain_name}"
}

# Pub/Sub Topics
output "user_events_topic" {
  description = "The name of the user events Pub/Sub topic"
  value       = google_pubsub_topic.user_events.name
}

output "transaction_events_topic" {
  description = "The name of the transaction events Pub/Sub topic"
  value       = google_pubsub_topic.transaction_events.name
}

output "company_events_topic" {
  description = "The name of the company events Pub/Sub topic"
  value       = google_pubsub_topic.company_events.name
}

output "commission_events_topic" {
  description = "The name of the commission events Pub/Sub topic"
  value       = google_pubsub_topic.commission_events.name
}

output "notification_events_topic" {
  description = "The name of the notification events Pub/Sub topic"
  value       = google_pubsub_topic.notification_events.name
}

output "dead_letter_topic" {
  description = "The name of the dead letter Pub/Sub topic"
  value       = google_pubsub_topic.dead_letter.name
}

# Service Account
output "cloud_run_service_account_email" {
  description = "The email of the Cloud Run service account"
  value       = google_service_account.cloud_run.email
}

# Secret Manager
output "jwt_secret_id" {
  description = "The ID of the JWT secret in Secret Manager"
  value       = google_secret_manager_secret.jwt_secret.secret_id
}

output "platform_master_key_id" {
  description = "The ID of the platform master key in Secret Manager"
  value       = google_secret_manager_secret.platform_master_key.secret_id
  sensitive   = true
}

output "db_connection_secret_id" {
  description = "The ID of the database connection secret in Secret Manager"
  value       = google_secret_manager_secret.db_connection_string.secret_id
}

output "app_config_secret_id" {
  description = "The ID of the app configuration secret in Secret Manager"
  value       = google_secret_manager_secret.app_config.secret_id
}

# KMS Keys
output "database_kms_key_id" {
  description = "The ID of the database KMS key"
  value       = google_kms_crypto_key.database.id
}

output "secrets_kms_key_id" {
  description = "The ID of the secrets KMS key"
  value       = google_kms_crypto_key.secrets.id
}

# Container Registry
output "container_registry_url" {
  description = "The URL for the Google Container Registry"
  value       = "gcr.io/${var.project_id}"
}

# Monitoring
output "log_sink_name" {
  description = "The name of the log sink for centralized logging"
  value       = try(google_logging_project_sink.main.name, "not_created")
}

# SSL Certificate
output "ssl_certificate_name" {
  description = "The name of the managed SSL certificate"
  value       = google_compute_managed_ssl_certificate.main.name
}

# Random Suffix for Unique Naming
output "resource_suffix" {
  description = "Random suffix used for unique resource naming"
  value       = random_id.suffix.hex
}

# Environment-specific outputs
output "is_production" {
  description = "Whether this is a production environment"
  value       = var.environment == "production"
}

# Health Check URLs
output "identity_service_health_url" {
  description = "Health check URL for Identity Service"
  value       = "${google_cloud_run_v2_service.identity_service.uri}/health"
}

output "company_service_health_url" {
  description = "Health check URL for Company Service"  
  value       = "${google_cloud_run_v2_service.company_service.uri}/health"
}

# API Endpoints
output "api_endpoints" {
  description = "Map of API endpoints for each service"
  value = {
    identity_service = "${google_cloud_run_v2_service.identity_service.uri}/api"
    company_service  = "${google_cloud_run_v2_service.company_service.uri}/api"
    load_balancer    = "https://${var.domain_name}/api"
  }
}

# Deployment Information
output "deployment_info" {
  description = "Deployment information and next steps"
  value = {
    message = "🚀 Sabs v2 infrastructure deployed successfully!"
    next_steps = [
      "1. Update DNS records to point ${var.domain_name} to ${google_compute_global_address.main.address}",
      "2. Wait for SSL certificate provisioning to complete",
      "3. Build and push Docker images to gcr.io/${var.project_id}",
      "4. Deploy services using the CI/CD pipeline",
      "5. Run database migrations",
      "6. Verify all health checks are passing"
    ]
    important_secrets = [
      "Platform Master Key: ${google_secret_manager_secret.platform_master_key.secret_id}",
      "JWT Secret: ${google_secret_manager_secret.jwt_secret.secret_id}",
      "Database Connection: ${google_secret_manager_secret.db_connection_string.secret_id}"
    ]
  }
}

# Container Registry URL (computed)
output "google_container_registry_url" {
  description = "Google Container Registry URL"
  value = {
    registry_url = "gcr.io/${var.project_id}"
    identity_service_image = "gcr.io/${var.project_id}/${var.project_name}-identity-service"
    company_service_image = "gcr.io/${var.project_id}/${var.project_name}-company-service"
  }
}