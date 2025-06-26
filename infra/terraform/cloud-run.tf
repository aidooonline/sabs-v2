# Service Account for Cloud Run services
resource "google_service_account" "cloud_run" {
  account_id   = "${var.project_name}-cloud-run"
  display_name = "Cloud Run Service Account"
  description  = "Service account for Sabs v2 Cloud Run services"
}

# IAM bindings for Cloud Run service account
resource "google_project_iam_member" "cloud_run_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_project_iam_member" "cloud_run_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_project_iam_member" "cloud_run_pubsub_publisher" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_project_iam_member" "cloud_run_pubsub_subscriber" {
  project = var.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_project_iam_member" "cloud_run_logging_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_project_iam_member" "cloud_run_monitoring_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_project_iam_member" "cloud_run_trace_agent" {
  project = var.project_id
  role    = "roles/cloudtrace.agent"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Frontend Service
resource "google_cloud_run_v2_service" "frontend" {
  name     = "${var.project_name}-frontend"
  location = var.region

  template {
    service_account = google_service_account.cloud_run.email

    scaling {
      min_instance_count = var.environment == "production" ? 1 : 0
      max_instance_count = var.environment == "production" ? 10 : 3
    }

    containers {
      image = "gcr.io/${var.project_id}/${var.project_name}-frontend:latest"

      ports {
        container_port = 3000
      }

      env {
        name  = "NODE_ENV"
        value = var.environment
      }

      env {
        name  = "PORT"
        value = "3000"
      }

      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = var.environment == "staging" ? "https://staging-api.sabs-v2.com" : "https://api.sabsv2.com"
      }

      env {
        name  = "NEXT_PUBLIC_ENVIRONMENT"
        value = var.environment
      }

      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }

      resources {
        limits = {
          cpu    = var.environment == "production" ? "2" : "1"
          memory = var.environment == "production" ? "2Gi" : "1Gi"
        }
      }

      startup_probe {
        http_get {
          path = "/"
          port = 3000
        }
        initial_delay_seconds = 30
        timeout_seconds       = 5
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/"
          port = 3000
        }
        initial_delay_seconds = 30
        timeout_seconds       = 5
        period_seconds        = 30
        failure_threshold     = 3
      }
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  depends_on = [
    google_project_service.required_apis
  ]
}

# Identity Service
resource "google_cloud_run_v2_service" "identity_service" {
  name     = "${var.project_name}-identity-service"
  location = var.region

  template {
    service_account = google_service_account.cloud_run.email

    scaling {
      min_instance_count = var.environment == "production" ? 1 : 0
      max_instance_count = var.environment == "production" ? 10 : 3
    }

    containers {
      image = "gcr.io/${var.project_id}/${var.project_name}-identity-service:latest"

      ports {
        container_port = 3001
      }

      env {
        name  = "NODE_ENV"
        value = var.environment
      }

      env {
        name  = "PORT"
        value = "3001"
      }

      env {
        name = "DB_CONNECTION_STRING"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_connection_string.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.jwt_secret.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }

      resources {
        limits = {
          cpu    = var.environment == "production" ? "2" : "1"
          memory = var.environment == "production" ? "2Gi" : "1Gi"
        }
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 3001
        }
        initial_delay_seconds = 30
        timeout_seconds       = 5
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 3001
        }
        initial_delay_seconds = 30
        timeout_seconds       = 5
        period_seconds        = 30
        failure_threshold     = 3
      }
    }

    vpc_access {
      connector = google_vpc_access_connector.main.id
      egress    = "ALL_TRAFFIC"
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  depends_on = [
    google_project_service.required_apis,
    google_secret_manager_secret_version.db_connection_string
  ]
}

# Company Service
resource "google_cloud_run_v2_service" "company_service" {
  name     = "${var.project_name}-company-service"
  location = var.region

  template {
    service_account = google_service_account.cloud_run.email

    scaling {
      min_instance_count = var.environment == "production" ? 1 : 0
      max_instance_count = var.environment == "production" ? 10 : 3
    }

    containers {
      image = "gcr.io/${var.project_id}/${var.project_name}-company-service:latest"

      ports {
        container_port = 3002
      }

      env {
        name  = "NODE_ENV"
        value = var.environment
      }

      env {
        name  = "PORT"
        value = "3002"
      }

      env {
        name = "DB_CONNECTION_STRING"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_connection_string.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }

      resources {
        limits = {
          cpu    = var.environment == "production" ? "2" : "1"
          memory = var.environment == "production" ? "2Gi" : "1Gi"
        }
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 3002
        }
        initial_delay_seconds = 30
        timeout_seconds       = 5
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 3002
        }
        initial_delay_seconds = 30
        timeout_seconds       = 5
        period_seconds        = 30
        failure_threshold     = 3
      }
    }

    vpc_access {
      connector = google_vpc_access_connector.main.id
      egress    = "ALL_TRAFFIC"
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  depends_on = [
    google_project_service.required_apis,
    google_secret_manager_secret_version.db_connection_string
  ]
}

# Accounts Service
resource "google_cloud_run_v2_service" "accounts_service" {
  name     = "${var.project_name}-accounts-service"
  location = var.region

  template {
    service_account = google_service_account.cloud_run.email

    scaling {
      min_instance_count = var.environment == "production" ? 1 : 0
      max_instance_count = var.environment == "production" ? 10 : 3
    }

    containers {
      image = "gcr.io/${var.project_id}/${var.project_name}-accounts-service:latest"

      ports {
        container_port = 3003
      }

      env {
        name  = "NODE_ENV"
        value = var.environment
      }

      env {
        name  = "PORT"
        value = "3003"
      }

      env {
        name = "DB_CONNECTION_STRING"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_connection_string.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }

      resources {
        limits = {
          cpu    = var.environment == "production" ? "2" : "1"
          memory = var.environment == "production" ? "2Gi" : "1Gi"
        }
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 3003
        }
        initial_delay_seconds = 30
        timeout_seconds       = 5
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 3003
        }
        initial_delay_seconds = 30
        timeout_seconds       = 5
        period_seconds        = 30
        failure_threshold     = 3
      }
    }

    vpc_access {
      connector = google_vpc_access_connector.main.id
      egress    = "ALL_TRAFFIC"
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  depends_on = [
    google_project_service.required_apis,
    google_secret_manager_secret_version.db_connection_string
  ]
}

# Mobile Service
resource "google_cloud_run_v2_service" "mobile_service" {
  name     = "${var.project_name}-mobile-service"
  location = var.region

  template {
    service_account = google_service_account.cloud_run.email

    scaling {
      min_instance_count = var.environment == "production" ? 1 : 0
      max_instance_count = var.environment == "production" ? 10 : 3
    }

    containers {
      image = "gcr.io/${var.project_id}/${var.project_name}-mobile-service:latest"

      ports {
        container_port = 3004
      }

      env {
        name  = "NODE_ENV"
        value = var.environment
      }

      env {
        name  = "PORT"
        value = "3004"
      }

      env {
        name = "DB_CONNECTION_STRING"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_connection_string.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }

      resources {
        limits = {
          cpu    = var.environment == "production" ? "2" : "1"
          memory = var.environment == "production" ? "2Gi" : "1Gi"
        }
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 3004
        }
        initial_delay_seconds = 30
        timeout_seconds       = 5
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 3004
        }
        initial_delay_seconds = 30
        timeout_seconds       = 5
        period_seconds        = 30
        failure_threshold     = 3
      }
    }

    vpc_access {
      connector = google_vpc_access_connector.main.id
      egress    = "ALL_TRAFFIC"
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  depends_on = [
    google_project_service.required_apis,
    google_secret_manager_secret_version.db_connection_string
  ]
}

# VPC Connector for Cloud Run to access private resources
resource "google_vpc_access_connector" "main" {
  name          = "${var.project_name}-vpc-connector"
  region        = var.region
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.main.name

  min_instances = 2
  max_instances = 10

  depends_on = [google_project_service.required_apis]
}

# Cloud Run IAM for public access (can be restricted later)
resource "google_cloud_run_service_iam_member" "frontend_public" {
  service  = google_cloud_run_v2_service.frontend.name
  location = google_cloud_run_v2_service.frontend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "identity_public" {
  service  = google_cloud_run_v2_service.identity_service.name
  location = google_cloud_run_v2_service.identity_service.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "company_public" {
  service  = google_cloud_run_v2_service.company_service.name
  location = google_cloud_run_v2_service.company_service.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "accounts_public" {
  service  = google_cloud_run_v2_service.accounts_service.name
  location = google_cloud_run_v2_service.accounts_service.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "mobile_public" {
  service  = google_cloud_run_v2_service.mobile_service.name
  location = google_cloud_run_v2_service.mobile_service.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Load Balancer for Cloud Run services
resource "google_compute_url_map" "main" {
  name            = "${var.project_name}-url-map"
  default_service = google_compute_backend_service.frontend.id

  host_rule {
    hosts        = [var.domain_name]
    path_matcher = "allpaths"
  }

  path_matcher {
    name            = "allpaths"
    default_service = google_compute_backend_service.frontend.id

    path_rule {
      paths   = ["/api/auth/*", "/api/users/*"]
      service = google_compute_backend_service.identity_service.id
    }

    path_rule {
      paths   = ["/api/companies/*"]
      service = google_compute_backend_service.company_service.id
    }

    path_rule {
      paths   = ["/api/accounts/*", "/api/transactions/*"]
      service = google_compute_backend_service.accounts_service.id
    }

    path_rule {
      paths   = ["/api/mobile/*"]
      service = google_compute_backend_service.mobile_service.id
    }
  }
}

# Backend Services for Load Balancer
resource "google_compute_backend_service" "frontend" {
  name                            = "${var.project_name}-frontend-backend"
  protocol                        = "HTTP"
  timeout_sec                     = 30
  connection_draining_timeout_sec = 300

  backend {
    group = google_compute_region_network_endpoint_group.frontend.id
  }

  health_checks = [google_compute_health_check.frontend.id]
}

resource "google_compute_backend_service" "identity_service" {
  name                            = "${var.project_name}-identity-backend"
  protocol                        = "HTTP"
  timeout_sec                     = 30
  connection_draining_timeout_sec = 300

  backend {
    group = google_compute_region_network_endpoint_group.identity_service.id
  }

  health_checks = [google_compute_health_check.identity_service.id]
}

resource "google_compute_backend_service" "company_service" {
  name                            = "${var.project_name}-company-backend"
  protocol                        = "HTTP"
  timeout_sec                     = 30
  connection_draining_timeout_sec = 300

  backend {
    group = google_compute_region_network_endpoint_group.company_service.id
  }

  health_checks = [google_compute_health_check.company_service.id]
}

resource "google_compute_backend_service" "accounts_service" {
  name                            = "${var.project_name}-accounts-backend"
  protocol                        = "HTTP"
  timeout_sec                     = 30
  connection_draining_timeout_sec = 300

  backend {
    group = google_compute_region_network_endpoint_group.accounts_service.id
  }

  health_checks = [google_compute_health_check.accounts_service.id]
}

resource "google_compute_backend_service" "mobile_service" {
  name                            = "${var.project_name}-mobile-backend"
  protocol                        = "HTTP"
  timeout_sec                     = 30
  connection_draining_timeout_sec = 300

  backend {
    group = google_compute_region_network_endpoint_group.mobile_service.id
  }

  health_checks = [google_compute_health_check.mobile_service.id]
}

# Network Endpoint Groups
resource "google_compute_region_network_endpoint_group" "frontend" {
  name                  = "${var.project_name}-frontend-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.frontend.name
  }
}

resource "google_compute_region_network_endpoint_group" "identity_service" {
  name                  = "${var.project_name}-identity-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.identity_service.name
  }
}

resource "google_compute_region_network_endpoint_group" "company_service" {
  name                  = "${var.project_name}-company-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.company_service.name
  }
}

resource "google_compute_region_network_endpoint_group" "accounts_service" {
  name                  = "${var.project_name}-accounts-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.accounts_service.name
  }
}

resource "google_compute_region_network_endpoint_group" "mobile_service" {
  name                  = "${var.project_name}-mobile-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.mobile_service.name
  }
}

# Health Checks
resource "google_compute_health_check" "frontend" {
  name = "${var.project_name}-frontend-health"

  http_health_check {
    port         = 3000
    request_path = "/"
  }

  check_interval_sec  = 30
  timeout_sec         = 5
  healthy_threshold   = 2
  unhealthy_threshold = 3
}

resource "google_compute_health_check" "identity_service" {
  name = "${var.project_name}-identity-health"

  http_health_check {
    port         = 3001
    request_path = "/health"
  }

  check_interval_sec  = 30
  timeout_sec         = 5
  healthy_threshold   = 2
  unhealthy_threshold = 3
}

resource "google_compute_health_check" "company_service" {
  name = "${var.project_name}-company-health"

  http_health_check {
    port         = 3002
    request_path = "/health"
  }

  check_interval_sec  = 30
  timeout_sec         = 5
  healthy_threshold   = 2
  unhealthy_threshold = 3
}

resource "google_compute_health_check" "accounts_service" {
  name = "${var.project_name}-accounts-health"

  http_health_check {
    port         = 3003
    request_path = "/health"
  }

  check_interval_sec  = 30
  timeout_sec         = 5
  healthy_threshold   = 2
  unhealthy_threshold = 3
}

resource "google_compute_health_check" "mobile_service" {
  name = "${var.project_name}-mobile-health"

  http_health_check {
    port         = 3004
    request_path = "/health"
  }

  check_interval_sec  = 30
  timeout_sec         = 5
  healthy_threshold   = 2
  unhealthy_threshold = 3
}

# HTTPS Proxy
resource "google_compute_target_https_proxy" "main" {
  name             = "${var.project_name}-https-proxy"
  url_map          = google_compute_url_map.main.id
  ssl_certificates = [google_compute_managed_ssl_certificate.main.id]
}

# Forwarding Rule
resource "google_compute_global_forwarding_rule" "main" {
  name       = "${var.project_name}-forwarding-rule"
  target     = google_compute_target_https_proxy.main.id
  port_range = "443"
  ip_address = google_compute_global_address.main.address
}