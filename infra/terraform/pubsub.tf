# Pub/Sub Topics for Event-Driven Architecture

# User Events
resource "google_pubsub_topic" "user_events" {
  name = "${var.project_name}-user-events"

  message_retention_duration = "604800s" # 7 days
  
  message_storage_policy {
    allowed_persistence_regions = [var.region]
  }
}

# Transaction Events
resource "google_pubsub_topic" "transaction_events" {
  name = "${var.project_name}-transaction-events"

  message_retention_duration = "604800s" # 7 days
  
  message_storage_policy {
    allowed_persistence_regions = [var.region]
  }
}

# Company Events
resource "google_pubsub_topic" "company_events" {
  name = "${var.project_name}-company-events"

  message_retention_duration = "604800s" # 7 days
  
  message_storage_policy {
    allowed_persistence_regions = [var.region]
  }
}

# Commission Events
resource "google_pubsub_topic" "commission_events" {
  name = "${var.project_name}-commission-events"

  message_retention_duration = "604800s" # 7 days
  
  message_storage_policy {
    allowed_persistence_regions = [var.region]
  }
}

# Notification Events
resource "google_pubsub_topic" "notification_events" {
  name = "${var.project_name}-notification-events"

  message_retention_duration = "604800s" # 7 days
  
  message_storage_policy {
    allowed_persistence_regions = [var.region]
  }
}

# Dead Letter Topic for failed messages
resource "google_pubsub_topic" "dead_letter" {
  name = "${var.project_name}-dead-letter"

  message_retention_duration = "2592000s" # 30 days
  
  message_storage_policy {
    allowed_persistence_regions = [var.region]
  }
}

# Subscriptions for each service

# Identity Service Subscriptions
resource "google_pubsub_subscription" "identity_user_events" {
  name  = "${var.project_name}-identity-user-events"
  topic = google_pubsub_topic.user_events.name

  ack_deadline_seconds = 20
  message_retention_duration = "604800s"

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  push_config {
    push_endpoint = "${google_cloud_run_v2_service.identity_service.uri}/webhooks/user-events"
    
    oidc_token {
      service_account_email = google_service_account.cloud_run.email
    }
  }
}

# Company Service Subscriptions
resource "google_pubsub_subscription" "company_events_sub" {
  name  = "${var.project_name}-company-events-sub" 
  topic = google_pubsub_topic.company_events.name

  ack_deadline_seconds = 20
  message_retention_duration = "604800s"

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  push_config {
    push_endpoint = "${google_cloud_run_v2_service.company_service.uri}/webhooks/company-events"
    
    oidc_token {
      service_account_email = google_service_account.cloud_run.email
    }
  }
}

# Accounts Service Subscriptions (handles transactions)
resource "google_pubsub_subscription" "transaction_events_sub" {
  name  = "${var.project_name}-transaction-events-sub"
  topic = google_pubsub_topic.transaction_events.name

  ack_deadline_seconds = 20
  message_retention_duration = "604800s"

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  push_config {
    push_endpoint = "${google_cloud_run_v2_service.accounts_service.uri}/webhooks/transaction-events"
    
    oidc_token {
      service_account_email = google_service_account.cloud_run.email
    }
  }
}

# Mobile Service Subscriptions (handles notifications)
resource "google_pubsub_subscription" "notification_events_sub" {
  name  = "${var.project_name}-notification-events-sub"
  topic = google_pubsub_topic.notification_events.name

  ack_deadline_seconds = 20
  message_retention_duration = "604800s"

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  push_config {
    push_endpoint = "${google_cloud_run_v2_service.mobile_service.uri}/webhooks/notification-events"
    
    oidc_token {
      service_account_email = google_service_account.cloud_run.email
    }
  }
}