# Log Sink for centralized logging
resource "google_logging_project_sink" "main" {
  count = var.enable_detailed_monitoring ? 1 : 0
  
  name = "${var.project_name}-log-sink"
  
  # Send all logs to Cloud Logging
  destination = "logging.googleapis.com/projects/${var.project_id}/logs/${var.project_name}-application-logs"
  
  # Filter for application logs
  filter = <<-EOT
    resource.type=("cloud_run_revision" OR "gce_instance" OR "cloud_sql_database")
    severity>=INFO
    OR
    (resource.type="cloud_run_revision" AND 
     labels.service_name=~"${var.project_name}-.*-service")
  EOT

  # Use a unique writer identity
  unique_writer_identity = true
}

# Error Reporting
resource "google_project_service" "error_reporting" {
  service = "clouderrorreporting.googleapis.com"
  project = var.project_id
}

# Uptime Checks for Cloud Run Services
resource "google_monitoring_uptime_check_config" "identity_service_uptime" {
  count = var.enable_detailed_monitoring ? 1 : 0
  
  display_name = "${var.project_name}-identity-service-uptime"
  timeout      = "30s"
  period       = "300s" # 5 minutes

  http_check {
    path           = "/health"
    port           = 443
    use_ssl        = true
    validate_ssl   = true
    request_method = "GET"
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = google_cloud_run_v2_service.identity_service.uri
    }
  }

  content_matchers {
    content = "OK"
    matcher = "CONTAINS_STRING"
  }
}

resource "google_monitoring_uptime_check_config" "company_service_uptime" {
  count = var.enable_detailed_monitoring ? 1 : 0
  
  display_name = "${var.project_name}-company-service-uptime"
  timeout      = "30s"
  period       = "300s" # 5 minutes

  http_check {
    path           = "/health"
    port           = 443
    use_ssl        = true
    validate_ssl   = true
    request_method = "GET"
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = google_cloud_run_v2_service.company_service.uri
    }
  }

  content_matchers {
    content = "OK"
    matcher = "CONTAINS_STRING"
  }
}

# Alert Policies
resource "google_monitoring_alert_policy" "high_error_rate" {
  count = var.enable_detailed_monitoring ? 1 : 0
  
  display_name = "${var.project_name}-high-error-rate"
  combiner     = "OR"
  
  conditions {
    display_name = "High error rate on Cloud Run services"
    
    condition_threshold {
      filter         = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=~\"${var.project_name}-.*-service\""
      duration       = "300s"
      comparison     = "COMPARISON_GT"
      threshold_value = 0.05 # 5% error rate
      
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_MEAN"
        group_by_fields = ["resource.labels.service_name"]
      }
    }
  }

  alert_strategy {
    auto_close = "86400s" # 24 hours
  }

  notification_channels = var.notification_channels

  documentation {
    content = "High error rate detected on Sabs v2 services. Please check service logs and health."
    mime_type = "text/markdown"
  }
}

resource "google_monitoring_alert_policy" "uptime_check_failure" {
  count = var.enable_detailed_monitoring ? 1 : 0
  
  display_name = "${var.project_name}-uptime-check-failure"
  combiner     = "OR"
  
  conditions {
    display_name = "Uptime check failure"
    
    condition_threshold {
      filter         = "resource.type=\"uptime_url\" AND metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\""
      duration       = "300s"
      comparison     = "COMPARISON_LT"
      threshold_value = 1
      
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_FRACTION_TRUE"
        cross_series_reducer = "REDUCE_MEAN"
        group_by_fields = ["resource.labels.host"]
      }
    }
  }

  alert_strategy {
    auto_close = "86400s" # 24 hours
  }

  notification_channels = var.notification_channels

  documentation {
    content = "Uptime check failure detected for Sabs v2 services. Service may be down or unresponsive."
    mime_type = "text/markdown"
  }
}

resource "google_monitoring_alert_policy" "database_cpu_usage" {
  count = var.enable_detailed_monitoring ? 1 : 0
  
  display_name = "${var.project_name}-database-high-cpu"
  combiner     = "OR"
  
  conditions {
    display_name = "High database CPU usage"
    
    condition_threshold {
      filter         = "resource.type=\"cloudsql_database\" AND resource.labels.database_id=\"${var.project_id}:${google_sql_database_instance.main.name}\""
      duration       = "300s"
      comparison     = "COMPARISON_GT"
      threshold_value = 0.8 # 80% CPU usage
      
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_MEAN"
        cross_series_reducer = "REDUCE_MEAN"
      }
    }
  }

  alert_strategy {
    auto_close = "86400s" # 24 hours
  }

  notification_channels = var.notification_channels

  documentation {
    content = "High CPU usage detected on Sabs v2 database. Consider scaling up the instance."
    mime_type = "text/markdown"
  }
}

resource "google_monitoring_alert_policy" "database_memory_usage" {
  count = var.enable_detailed_monitoring ? 1 : 0
  
  display_name = "${var.project_name}-database-high-memory"
  combiner     = "OR"
  
  conditions {
    display_name = "High database memory usage"
    
    condition_threshold {
      filter         = "resource.type=\"cloudsql_database\" AND resource.labels.database_id=\"${var.project_id}:${google_sql_database_instance.main.name}\""
      duration       = "300s"
      comparison     = "COMPARISON_GT"
      threshold_value = 0.85 # 85% memory usage
      
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_MEAN"
        cross_series_reducer = "REDUCE_MEAN"
      }
    }
  }

  alert_strategy {
    auto_close = "86400s" # 24 hours
  }

  notification_channels = var.notification_channels

  documentation {
    content = "High memory usage detected on Sabs v2 database. Consider scaling up the instance."
    mime_type = "text/markdown"
  }
}

# Cloud Trace for distributed tracing
resource "google_project_service" "trace" {
  service = "cloudtrace.googleapis.com"
  project = var.project_id
}

# Cloud Profiler for performance profiling
resource "google_project_service" "profiler" {
  service = "cloudprofiler.googleapis.com"
  project = var.project_id
}

# Custom Metrics for Business Logic
resource "google_logging_metric" "transaction_count" {
  count = var.enable_detailed_monitoring ? 1 : 0
  
  name   = "${var.project_name}_transaction_count"
  filter = "resource.type=\"cloud_run_revision\" AND jsonPayload.event_type=\"transaction_completed\""
  
  label_extractors = {
    transaction_type = "EXTRACT(jsonPayload.transaction_type)"
    company_id       = "EXTRACT(jsonPayload.company_id)"
  }
  
  metric_descriptor {
    metric_kind = "COUNTER"
    value_type  = "INT64"
    unit        = "1"
    labels {
      key         = "transaction_type"
      value_type  = "STRING"
      description = "Type of transaction (deposit, withdrawal, etc.)"
    }
    labels {
      key         = "company_id"
      value_type  = "STRING"
      description = "Company ID for multi-tenant tracking"
    }
  }
}

resource "google_logging_metric" "user_registrations" {
  count = var.enable_detailed_monitoring ? 1 : 0
  
  name   = "${var.project_name}_user_registrations"
  filter = "resource.type=\"cloud_run_revision\" AND jsonPayload.event_type=\"user_registered\""
  
  label_extractors = {
    user_role   = "EXTRACT(jsonPayload.user_role)"
    company_id  = "EXTRACT(jsonPayload.company_id)"
  }
  
  metric_descriptor {
    metric_kind = "COUNTER"
    value_type  = "INT64"
    unit        = "1"
    labels {
      key         = "user_role"
      value_type  = "STRING"
      description = "Role of the registered user"
    }
    labels {
      key         = "company_id"
      value_type  = "STRING"
      description = "Company ID for multi-tenant tracking"
    }
  }
}

resource "google_logging_metric" "api_response_times" {
  count = var.enable_detailed_monitoring ? 1 : 0
  
  name   = "${var.project_name}_api_response_times"
  filter = "resource.type=\"cloud_run_revision\" AND httpRequest.status>=200 AND httpRequest.status<500"
  
  label_extractors = {
    service_name = "EXTRACT(resource.labels.service_name)"
    endpoint     = "EXTRACT(httpRequest.requestUrl)"
    method       = "EXTRACT(httpRequest.requestMethod)"
  }
  
  value_extractor = "EXTRACT(httpRequest.latency)"
  
  metric_descriptor {
    metric_kind = "GAUGE"
    value_type  = "DISTRIBUTION"
    unit        = "s"
    labels {
      key         = "service_name"
      value_type  = "STRING"
      description = "Name of the service"
    }
    labels {
      key         = "endpoint"
      value_type  = "STRING"
      description = "API endpoint"
    }
    labels {
      key         = "method"
      value_type  = "STRING"
      description = "HTTP method"
    }
  }
  
  bucket_options {
    exponential_buckets {
      num_finite_buckets = 64
      growth_factor      = 2
      scale              = 0.01
    }
  }
}

# Dashboard for monitoring
resource "google_monitoring_dashboard" "main" {
  count = var.enable_detailed_monitoring ? 1 : 0
  
  dashboard_json = jsonencode({
    displayName = "${var.project_name} - Application Dashboard"
    mosaicLayout = {
      tiles = [
        {
          width = 6
          height = 4
          xPos = 0
          yPos = 0
          widget = {
            title = "Service Request Rate"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=~\"${var.project_name}-.*-service\""
                    aggregation = {
                      alignmentPeriod = "60s"
                      perSeriesAligner = "ALIGN_RATE"
                      crossSeriesReducer = "REDUCE_SUM"
                      groupByFields = ["resource.labels.service_name"]
                    }
                  }
                }
                plotType = "LINE"
              }]
              timeshiftDuration = "0s"
              yAxis = {
                label = "Requests per second"
                scale = "LINEAR"
              }
            }
          }
        },
        {
          width = 6
          height = 4
          xPos = 6
          yPos = 0
          widget = {
            title = "Service Error Rate"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=~\"${var.project_name}-.*-service\""
                    aggregation = {
                      alignmentPeriod = "60s"
                      perSeriesAligner = "ALIGN_RATE"
                      crossSeriesReducer = "REDUCE_MEAN"
                      groupByFields = ["resource.labels.service_name"]
                    }
                  }
                }
                plotType = "LINE"
              }]
              timeshiftDuration = "0s"
              yAxis = {
                label = "Error rate"
                scale = "LINEAR"
              }
            }
          }
        },
        {
          width = 12
          height = 4
          xPos = 0
          yPos = 4
          widget = {
            title = "Database Performance"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloudsql_database\" AND metric.type=\"cloudsql.googleapis.com/database/cpu/utilization\""
                      aggregation = {
                        alignmentPeriod = "60s"
                        perSeriesAligner = "ALIGN_MEAN"
                      }
                    }
                  }
                  plotType = "LINE"
                  targetAxis = "Y1"
                },
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloudsql_database\" AND metric.type=\"cloudsql.googleapis.com/database/memory/utilization\""
                      aggregation = {
                        alignmentPeriod = "60s"
                        perSeriesAligner = "ALIGN_MEAN"
                      }
                    }
                  }
                  plotType = "LINE"
                  targetAxis = "Y2"
                }
              ]
              timeshiftDuration = "0s"
              yAxis = {
                label = "CPU Utilization"
                scale = "LINEAR"
              }
              y2Axis = {
                label = "Memory Utilization"
                scale = "LINEAR"
              }
            }
          }
        }
      ]
    }
  })
}