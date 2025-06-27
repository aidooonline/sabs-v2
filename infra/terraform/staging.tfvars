# Staging Environment Configuration for Sabs v2
# This file contains staging-specific values for Terraform variables

# Project Configuration
project_name = "sabs-v2"
environment  = "staging"

# Location Configuration
region = "us-central1"
zone   = "us-central1-a"

# Domain Configuration
domain_name = "staging.sabs-v2.com"

# Database Configuration (smaller instances for staging)
database_tier          = "db-g1-small"
database_disk_size     = 20
database_max_disk_size = 100
backup_retention_days  = 7

# Scaling Configuration (reduced for staging)
min_instances = 0
max_instances = 5
cpu_limit     = "1"
memory_limit  = "1Gi"

# Security Configuration
allowed_ip_ranges = ["0.0.0.0/0"] # Open access for staging testing - CAUTION: Not for production

# Administrative SSH Access - Restricted to Google Cloud IAP by default
# For additional security, add your specific IP ranges here
admin_ip_ranges = ["35.235.240.0/20"] # Google Cloud IAP IP range

# Monitoring Configuration
enable_detailed_monitoring = true
enable_flow_logs           = true

# Feature Flags
enable_ai_features       = true
enable_sms_notifications = true
enable_audit_logging     = true
enable_debug_mode        = true

# Development/Testing Configuration
enable_binary_authorization = false

# Network Configuration
enable_private_google_access = true

# Note: Sensitive variables like API keys and project_id should be set via:
# - GitHub Secrets (for CI/CD)
# - Environment variables
# - Command line parameters
# 
# Example usage:
# terraform plan -var-file="staging.tfvars" \
#   -var="project_id=$PROJECT_ID" \
#   -var="sms_api_key=$SMS_API_KEY" \
#   -var="openai_api_key=$OPENAI_API_KEY" \
#   -var="terraform_state_bucket=$TERRAFORM_STATE_BUCKET"