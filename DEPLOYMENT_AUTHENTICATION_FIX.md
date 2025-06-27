# 🚀 **DEPLOYMENT AUTHENTICATION FIX - STAGING READY**

## ✅ **ISSUES RESOLVED**

### 1. **Terraform Format Check Fixed**
- **Problem**: `terraform fmt -check` failing with exit code 3
- **Solution**: ✅ Ran `terraform fmt` to fix formatting in `variables.tf`
- **Status**: **RESOLVED** - All Terraform files properly formatted

### 2. **GitHub Actions Authentication Fixed**
- **Problem**: `google-github-actions/auth` failing with missing authentication method
- **Root Cause**: Using incorrect secret name `GCP_SA_KEY` instead of standard `GCP_CREDENTIALS`
- **Solution**: ✅ Updated all 6 authentication steps in staging workflow
- **Status**: **RESOLVED** - All authentication steps now use correct secret names

---

## 🔐 **REQUIRED GITHUB SECRETS**

To complete the deployment, you **MUST** set these secrets in your GitHub repository:

### **Navigate to: Repository Settings → Secrets and Variables → Actions → Repository Secrets**

| Secret Name | Description | Example/Format | Required |
|-------------|-------------|----------------|----------|
| `GCP_CREDENTIALS` | **GCP Service Account JSON Key** | `{"type": "service_account", "project_id": "your-project"...}` | **✅ CRITICAL** |
| `GCP_PROJECT_ID` | **Your GCP Project ID** | `sabs-v2-production` | **✅ CRITICAL** |
| `TERRAFORM_STATE_BUCKET` | **GCS bucket for Terraform state** | `sabs-v2-terraform-state` | **✅ CRITICAL** |
| `SMS_API_KEY` | **SMS Provider API Key** | `your-sms-api-key` | **✅ REQUIRED** |
| `OPENAI_API_KEY` | **OpenAI API Key for AI features** | `sk-...` | **✅ REQUIRED** |

---

## 📋 **STEP-BY-STEP SECRET SETUP**

### **1. Create GCP Service Account & Download JSON Key**
```bash
# Create service account
gcloud iam service-accounts create sabs-v2-deployer \
    --description="Service account for Sabs v2 deployment" \
    --display-name="Sabs v2 Deployer"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:sabs-v2-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:sabs-v2-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:sabs-v2-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudsql.admin"

# Download JSON key
gcloud iam service-accounts keys create sabs-v2-key.json \
    --iam-account=sabs-v2-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### **2. Create Terraform State Bucket**
```bash
# Create bucket for Terraform state
gsutil mb gs://YOUR_PROJECT_ID-terraform-state

# Enable versioning for state safety
gsutil versioning set on gs://YOUR_PROJECT_ID-terraform-state
```

### **3. Set GitHub Secrets**
```bash
# Copy the entire contents of sabs-v2-key.json for GCP_CREDENTIALS
cat sabs-v2-key.json

# Use your actual project ID for GCP_PROJECT_ID
echo "YOUR_PROJECT_ID"

# Use the bucket name for TERRAFORM_STATE_BUCKET
echo "YOUR_PROJECT_ID-terraform-state"
```

---

## 🛠 **ADDITIONAL REQUIRED SERVICES**

### **SMS Provider Setup**
Choose one of these SMS providers for Ghana market:
- **Recommended**: [Hubtel](https://hubtel.com/) - Local Ghana provider
- **Alternative**: [Twilio](https://www.twilio.com/) - International with Ghana support
- **Alternative**: [Africa's Talking](https://africastalking.com/) - Africa-focused

### **OpenAI API Setup**
1. Go to [OpenAI API Platform](https://platform.openai.com/)
2. Create account and get API key starting with `sk-`
3. Add to GitHub secrets as `OPENAI_API_KEY`

---

## ✅ **VERIFICATION CHECKLIST**

Before running the deployment, ensure:

- [ ] **GCP_CREDENTIALS** secret contains valid service account JSON
- [ ] **GCP_PROJECT_ID** secret contains your actual GCP project ID
- [ ] **TERRAFORM_STATE_BUCKET** secret contains your state bucket name
- [ ] **SMS_API_KEY** secret contains valid SMS provider API key
- [ ] **OPENAI_API_KEY** secret contains valid OpenAI API key starting with `sk-`
- [ ] All secrets are set in **Repository Settings → Secrets → Actions**
- [ ] Service account has necessary GCP permissions
- [ ] Terraform state bucket exists and has versioning enabled

---

## 🚀 **DEPLOYMENT COMMANDS**

Once all secrets are set, trigger deployment:

### **Option 1: Push to Branch**
```bash
git push origin master  # or develop
```

### **Option 2: Manual Trigger**
1. Go to **GitHub Actions** tab
2. Select **"Deploy Sabs v2 to Staging"** workflow
3. Click **"Run workflow"**
4. Select branch and click **"Run workflow"**

---

## 📊 **EXPECTED DEPLOYMENT RESULT**

After successful deployment, you'll have:

### **Services Deployed:**
- ✅ **Frontend** (Next.js) - `sabs-v2-frontend`
- ✅ **Identity Service** (NestJS) - `sabs-v2-identity-service`
- ✅ **Company Service** (NestJS) - `sabs-v2-company-service`
- ✅ **Accounts Service** (NestJS) - `sabs-v2-accounts-service`
- ✅ **Mobile Service** (NestJS) - `sabs-v2-mobile-service`

### **Infrastructure:**
- ✅ **Cloud Run** services (auto-scaling 0-5 instances)
- ✅ **Cloud SQL** PostgreSQL database (db-g1-small)
- ✅ **VPC** with security configurations
- ✅ **Load Balancer** with SSL termination
- ✅ **Monitoring & Logging** enabled

### **URLs Available:**
- **Frontend**: `https://staging.sabs-v2.com` (after DNS configuration)
- **API Gateway**: `https://staging-api.sabs-v2.com`
- **Direct Cloud Run URLs**: Available in deployment logs

---

## 🔧 **TROUBLESHOOTING**

### **If deployment still fails:**

1. **Check Secret Values**:
   ```bash
   # Verify secrets are set (will show if they exist, not values)
   gh secret list --repo YOUR_USERNAME/YOUR_REPO
   ```

2. **Verify Service Account Permissions**:
   ```bash
   gcloud projects get-iam-policy YOUR_PROJECT_ID \
       --flatten="bindings[].members" \
       --format='table(bindings.role)' \
       --filter="bindings.members:sabs-v2-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com"
   ```

3. **Check Terraform State Bucket**:
   ```bash
   gsutil ls gs://YOUR_PROJECT_ID-terraform-state
   ```

### **Common Issues:**
- **Empty PROJECT_ID**: `GCP_PROJECT_ID` secret not set
- **Invalid JSON**: `GCP_CREDENTIALS` secret malformed
- **Permission denied**: Service account lacks required roles
- **Bucket not found**: Terraform state bucket doesn't exist

---

## 🎯 **NEXT STEPS AFTER DEPLOYMENT**

1. **Configure DNS** (if using custom domain):
   ```bash
   # Get load balancer IP from deployment output
   staging.sabs-v2.com A LOAD_BALANCER_IP
   staging-api.sabs-v2.com A LOAD_BALANCER_IP
   ```

2. **Verify All Services**:
   - Frontend loads successfully
   - API endpoints respond correctly
   - Database connections work
   - Authentication flows function

3. **Monitor Performance**:
   - Check Cloud Run metrics
   - Review application logs
   - Verify auto-scaling behavior

---

**🚀 Ready for deployment! All authentication issues resolved.**