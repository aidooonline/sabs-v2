# Generate secure random secrets
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "random_password" "platform_master_key" {
  length  = 64
  special = true
}

resource "random_password" "encryption_key" {
  length  = 32
  special = false
  upper   = true
  lower   = true
  numeric = true
}

# JWT Secret for authentication
resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "${var.project_name}-jwt-secret"

  replication {
    user_managed {
      replicas {
        location = var.region
        customer_managed_encryption {
          kms_key_name = google_kms_crypto_key.secrets.id
        }
      }
    }
  }
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = random_password.jwt_secret.result
}

# Platform Master Key for super admin access
resource "google_secret_manager_secret" "platform_master_key" {
  secret_id = "${var.project_name}-platform-master-key"

  replication {
    user_managed {
      replicas {
        location = var.region
        customer_managed_encryption {
          kms_key_name = google_kms_crypto_key.secrets.id
        }
      }
    }
  }
}

resource "google_secret_manager_secret_version" "platform_master_key" {
  secret      = google_secret_manager_secret.platform_master_key.id
  secret_data = random_password.platform_master_key.result
}

# SMS Provider API Key
resource "google_secret_manager_secret" "sms_api_key" {
  secret_id = "${var.project_name}-sms-api-key"

  replication {
    user_managed {
      replicas {
        location = var.region
        customer_managed_encryption {
          kms_key_name = google_kms_crypto_key.secrets.id
        }
      }
    }
  }
}

resource "google_secret_manager_secret_version" "sms_api_key" {
  secret      = google_secret_manager_secret.sms_api_key.id
  secret_data = var.sms_api_key != "" ? var.sms_api_key : "placeholder-sms-key"
}

# OpenAI API Key for AI features
resource "google_secret_manager_secret" "openai_api_key" {
  secret_id = "${var.project_name}-openai-api-key"

  replication {
    user_managed {
      replicas {
        location = var.region
        customer_managed_encryption {
          kms_key_name = google_kms_crypto_key.secrets.id
        }
      }
    }
  }
}

resource "google_secret_manager_secret_version" "openai_api_key" {
  secret      = google_secret_manager_secret.openai_api_key.id
  secret_data = var.openai_api_key != "" ? var.openai_api_key : "placeholder-openai-key"
}

# Redis connection string (for future use)
resource "google_secret_manager_secret" "redis_connection" {
  secret_id = "${var.project_name}-redis-connection"

  replication {
    user_managed {
      replicas {
        location = var.region
        customer_managed_encryption {
          kms_key_name = google_kms_crypto_key.secrets.id
        }
      }
    }
  }
}

resource "google_secret_manager_secret_version" "redis_connection" {
  secret      = google_secret_manager_secret.redis_connection.id
  secret_data = "redis://placeholder-redis-connection"
}

# Application configuration secrets
resource "google_secret_manager_secret" "app_config" {
  secret_id = "${var.project_name}-app-config"

  replication {
    user_managed {
      replicas {
        location = var.region
        customer_managed_encryption {
          kms_key_name = google_kms_crypto_key.secrets.id
        }
      }
    }
  }
}

resource "google_secret_manager_secret_version" "app_config" {
  secret = google_secret_manager_secret.app_config.id
  secret_data = jsonencode({
    environment = var.environment
    project_id  = var.project_id
    region      = var.region
    cors_origins = [
      "https://${var.domain_name}",
      var.environment == "development" ? "http://localhost:3000" : ""
    ]
    rate_limits = {
      auth_requests_per_minute = var.environment == "production" ? 60 : 1000
      api_requests_per_minute  = var.environment == "production" ? 1000 : 10000
    }
    features = {
      ai_assistant_enabled       = true
      sms_notifications_enabled  = true
      advanced_analytics_enabled = var.environment == "production"
    }
  })
}

# Service-to-service authentication secret
resource "google_secret_manager_secret" "service_auth_key" {
  secret_id = "${var.project_name}-service-auth-key"

  replication {
    user_managed {
      replicas {
        location = var.region
        customer_managed_encryption {
          kms_key_name = google_kms_crypto_key.secrets.id
        }
      }
    }
  }
}

resource "google_secret_manager_secret_version" "service_auth_key" {
  secret      = google_secret_manager_secret.service_auth_key.id
  secret_data = random_password.encryption_key.result
}

# Webhook secrets for external integrations
resource "google_secret_manager_secret" "webhook_secret" {
  secret_id = "${var.project_name}-webhook-secret"

  replication {
    user_managed {
      replicas {
        location = var.region
        customer_managed_encryption {
          kms_key_name = google_kms_crypto_key.secrets.id
        }
      }
    }
  }
}

resource "google_secret_manager_secret_version" "webhook_secret" {
  secret      = google_secret_manager_secret.webhook_secret.id
  secret_data = random_password.encryption_key.result
}