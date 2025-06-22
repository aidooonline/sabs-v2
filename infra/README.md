# Sabs v2 Infrastructure Deployment

This directory contains the Terraform configuration for deploying Sabs v2 infrastructure on Google Cloud Platform.

## 🏗️ Infrastructure Overview

The infrastructure includes:
- **VPC Network** with private subnets and Cloud NAT
- **Cloud SQL PostgreSQL** database with private networking
- **Cloud Run** services for microservices (Identity & Company)
- **Pub/Sub** topics and subscriptions for event-driven architecture
- **Secret Manager** for secure secrets storage with KMS encryption
- **Load Balancer** with SSL certificates for HTTPS
- **Monitoring & Alerting** with custom dashboards
- **IAM** roles and service accounts with least privilege

## 📋 Prerequisites

### 1. Tools Required
```bash
# Install required tools
# Terraform
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform

# Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Verify installations
terraform --version
gcloud --version
```

### 2. GCP Project Setup
```bash
# Set your project ID
export PROJECT_ID="your-gcp-project-id"

# Authenticate with GCP
gcloud auth login
gcloud auth application-default login

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  compute.googleapis.com \
  container.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  pubsub.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  cloudkms.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  cloudtrace.googleapis.com
```

### 3. Terraform State Bucket
```bash
# Create bucket for Terraform state
gsutil mb gs://${PROJECT_ID}-terraform-state
gsutil versioning set on gs://${PROJECT_ID}-terraform-state

# Enable bucket-level IAM
gsutil iam ch serviceAccount:terraform@${PROJECT_ID}.iam.gserviceaccount.com:roles/storage.admin gs://${PROJECT_ID}-terraform-state
```

### 4. Service Account for Terraform
```bash
# Create Terraform service account
gcloud iam service-accounts create terraform \
    --description="Terraform automation service account" \
    --display-name="Terraform"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:terraform@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/owner"

# Create and download key
gcloud iam service-accounts keys create terraform-key.json \
    --iam-account=terraform@${PROJECT_ID}.iam.gserviceaccount.com

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="./terraform-key.json"
```

## 🚀 Deployment Instructions

### Step 1: Configure Variables
```bash
# Copy example configuration
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
vim terraform.tfvars
```

Required variables to update:
- `project_id`: Your GCP project ID
- `domain_name`: Your domain for the application
- `sms_api_key`: SMS provider API key (optional)
- `openai_api_key`: OpenAI API key (optional)
- `terraform_state_bucket`: Terraform state bucket name

### Step 2: Initialize Terraform
```bash
cd terraform
terraform init
```

### Step 3: Plan Deployment
```bash
# Review what will be created
terraform plan

# Save plan for approval
terraform plan -out=tfplan
```

### Step 4: Deploy Infrastructure
```bash
# Apply the configuration
terraform apply tfplan

# Or apply interactively
terraform apply
```

### Step 5: Verify Deployment
```bash
# Check outputs
terraform output

# Verify services are running
gcloud run services list --region=us-central1

# Check database status
gcloud sql instances list
```

## 🔧 Configuration Options

### Environment Configurations

#### Development
```hcl
environment = "development"
database_tier = "db-f1-micro"
min_instances = 0
enable_detailed_monitoring = false
enable_debug_mode = true
```

#### Staging
```hcl
environment = "staging"
database_tier = "db-g1-small"
min_instances = 1
max_instances = 5
enable_detailed_monitoring = true
```

#### Production
```hcl
environment = "production"
database_tier = "db-n1-standard-2"
min_instances = 2
max_instances = 20
enable_detailed_monitoring = true
enable_audit_logging = true
backup_retention_days = 30
```

### Security Configuration
```hcl
# Restrict access to specific IPs
allowed_ip_ranges = ["10.0.0.0/8", "192.168.1.0/24"]

# Enable binary authorization
enable_binary_authorization = true

# Enable audit logging
enable_audit_logging = true
```

## 📊 Monitoring & Observability

### Accessing Monitoring
1. **Cloud Console**: Go to Monitoring in GCP Console
2. **Dashboards**: Custom dashboard created at deployment
3. **Alerts**: Configured for high error rates, uptime failures, and resource usage

### Key Metrics Tracked
- Service request rates and latency
- Error rates by service
- Database CPU and memory utilization
- Transaction counts by type and company
- User registration events

### Custom Metrics
The infrastructure creates custom metrics for:
- Transaction completions
- User registrations
- API response times
- Business-specific events

## 🔐 Security Features

### Encryption
- **Data at Rest**: All databases and storage encrypted with KMS
- **Data in Transit**: HTTPS/TLS encryption for all communication
- **Secrets**: Stored in Secret Manager with customer-managed encryption

### Network Security
- **Private Networking**: Database accessible only through private IPs
- **VPC**: Custom VPC with controlled subnets
- **Firewall Rules**: Minimal required access rules
- **NAT Gateway**: Outbound internet access without public IPs

### IAM
- **Service Accounts**: Dedicated accounts with minimal permissions
- **Least Privilege**: Each service has only required permissions
- **Audit Logging**: All access and changes logged

## 🔄 Maintenance & Updates

### Updating Infrastructure
```bash
# Pull latest changes
git pull

# Plan updates
terraform plan

# Apply updates
terraform apply
```

### Database Maintenance
```bash
# Database backups are automated
# Manual backup
gcloud sql backups create --instance=sabs-v2-db

# View backups
gcloud sql backups list --instance=sabs-v2-db
```

### Scaling Services
```bash
# Update terraform.tfvars
min_instances = 2
max_instances = 20

# Apply changes
terraform apply
```

## 🚨 Troubleshooting

### Common Issues

#### 1. API Not Enabled
```bash
# Error: API not enabled
# Solution: Enable the required API
gcloud services enable [SERVICE_NAME]
```

#### 2. Insufficient Permissions
```bash
# Error: Permission denied
# Solution: Check service account permissions
gcloud projects get-iam-policy $PROJECT_ID
```

#### 3. SSL Certificate Provisioning
```bash
# Check certificate status
gcloud compute ssl-certificates list

# DNS must point to the load balancer IP
# Wait up to 60 minutes for provisioning
```

#### 4. Database Connection Issues
```bash
# Check VPC connector
gcloud compute networks vpc-access connectors list

# Verify private service connection
gcloud services vpc-peerings list
```

### Useful Commands
```bash
# View all resources
terraform state list

# Import existing resources
terraform import [RESOURCE_TYPE.NAME] [RESOURCE_ID]

# Destroy specific resource
terraform destroy -target=[RESOURCE_TYPE.NAME]

# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit=50
```

## 📈 Cost Optimization

### Development
- Use `db-f1-micro` for database
- Set `min_instances = 0` for services
- Disable detailed monitoring
- Use shorter backup retention

### Production
- Right-size database instances based on usage
- Enable auto-scaling with appropriate limits
- Use committed use discounts for predictable workloads
- Monitor costs with budget alerts

## 🔗 Next Steps

After infrastructure deployment:

1. **Update DNS**: Point your domain to the load balancer IP
2. **Build Images**: Create Docker images for services
3. **Deploy Services**: Use CI/CD pipeline to deploy applications
4. **Database Migration**: Run initial database migrations
5. **Testing**: Verify all services are healthy
6. **Monitoring**: Set up notification channels for alerts

## 📞 Support

For infrastructure issues:
1. Check the troubleshooting section above
2. Review Terraform logs: `terraform apply` output
3. Check GCP Console for resource status
4. Review monitoring dashboards for service health

---

**Next**: [CI/CD Pipeline Setup](../ci-cd/README.md)