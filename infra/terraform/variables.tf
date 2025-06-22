# Project Configuration
variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "project_name" {
  description = "Name of the project (used for resource naming)"
  type        = string
  default     = "sabs-v2"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "development"
  
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

# Location Configuration
variable "region" {
  description = "The GCP region for resources"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The GCP zone for zonal resources"
  type        = string
  default     = "us-central1-a"
}

# Domain Configuration
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "api.sabsv2.com"
}

# Database Configuration
variable "database_tier" {
  description = "The tier for the Cloud SQL instance"
  type        = string
  default     = "db-f1-micro"
  
  validation {
    condition = contains([
      "db-f1-micro", "db-g1-small", "db-n1-standard-1", "db-n1-standard-2",
      "db-n1-standard-4", "db-n1-standard-8", "db-n1-standard-16",
      "db-n1-highmem-2", "db-n1-highmem-4", "db-n1-highmem-8", "db-n1-highmem-16"
    ], var.database_tier)
    error_message = "Database tier must be a valid Cloud SQL machine type."
  }
}

variable "database_disk_size" {
  description = "The disk size for the Cloud SQL instance in GB"
  type        = number
  default     = 20
  
  validation {
    condition     = var.database_disk_size >= 10 && var.database_disk_size <= 4096
    error_message = "Database disk size must be between 10 and 4096 GB."
  }
}

variable "database_max_disk_size" {
  description = "The maximum disk size for the Cloud SQL instance in GB"
  type        = number
  default     = 100
  
  validation {
    condition     = var.database_max_disk_size >= 20 && var.database_max_disk_size <= 4096
    error_message = "Database max disk size must be between 20 and 4096 GB."
  }
}

# External Service Keys
variable "sms_api_key" {
  description = "API key for SMS provider"
  type        = string
  default     = ""
  sensitive   = true
}

variable "openai_api_key" {
  description = "API key for OpenAI services"
  type        = string
  default     = ""
  sensitive   = true
}

# Terraform State Configuration
variable "terraform_state_bucket" {
  description = "GCS bucket for Terraform state storage"
  type        = string
  default     = ""
}

# Network Configuration
variable "enable_private_google_access" {
  description = "Enable private Google access for the subnet"
  type        = bool
  default     = true
}

variable "enable_flow_logs" {
  description = "Enable VPC flow logs"
  type        = bool
  default     = false
}

# Security Configuration
variable "allowed_ip_ranges" {
  description = "List of IP ranges allowed to access the services"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "enable_binary_authorization" {
  description = "Enable Binary Authorization for container images"
  type        = bool
  default     = false
}

# Monitoring Configuration
variable "notification_channels" {
  description = "List of notification channel IDs for alerts"
  type        = list(string)
  default     = []
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed monitoring and logging"
  type        = bool
  default     = true
}

# Backup Configuration
variable "backup_retention_days" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 7
  
  validation {
    condition     = var.backup_retention_days >= 1 && var.backup_retention_days <= 365
    error_message = "Backup retention days must be between 1 and 365."
  }
}

# Scaling Configuration
variable "min_instances" {
  description = "Minimum number of instances for Cloud Run services"
  type        = number
  default     = 0
  
  validation {
    condition     = var.min_instances >= 0 && var.min_instances <= 100
    error_message = "Min instances must be between 0 and 100."
  }
}

variable "max_instances" {
  description = "Maximum number of instances for Cloud Run services"
  type        = number
  default     = 10
  
  validation {
    condition     = var.max_instances >= 1 && var.max_instances <= 1000
    error_message = "Max instances must be between 1 and 1000."
  }
}

# Resource Limits
variable "cpu_limit" {
  description = "CPU limit for Cloud Run services"
  type        = string
  default     = "1"
  
  validation {
    condition     = contains(["1", "2", "4", "8"], var.cpu_limit)
    error_message = "CPU limit must be one of: 1, 2, 4, 8."
  }
}

variable "memory_limit" {
  description = "Memory limit for Cloud Run services"
  type        = string
  default     = "1Gi"
  
  validation {
    condition = can(regex("^[0-9]+(Mi|Gi)$", var.memory_limit))
    error_message = "Memory limit must be specified in Mi or Gi (e.g., 512Mi, 1Gi, 2Gi)."
  }
}

# Feature Flags
variable "enable_ai_features" {
  description = "Enable AI-powered features"
  type        = bool
  default     = true
}

variable "enable_sms_notifications" {
  description = "Enable SMS notification features"
  type        = bool
  default     = true
}

variable "enable_audit_logging" {
  description = "Enable comprehensive audit logging"
  type        = bool
  default     = true
}

# Development Configuration
variable "enable_debug_mode" {
  description = "Enable debug mode for development"
  type        = bool
  default     = false
}