# 🚀 **Sabs v2 Staging Deployment Notes**

## **⚠️ Required Repository Secrets**

### **Missing Secret: SLACK_WEBHOOK_URL**

The staging deployment requires a Slack webhook URL to send deployment notifications. To configure this:

1. **Go to your Slack workspace**
2. **Create an Incoming Webhook:**
   - Visit: https://api.slack.com/apps
   - Create a new app or use existing
   - Go to "Incoming Webhooks" and activate them
   - Add webhook to workspace and select a channel
   - Copy the webhook URL (starts with `https://hooks.slack.com/services/...`)

3. **Add to GitHub Repository:**
   - Go to: https://github.com/aidooonline/sabs-v2/settings/secrets/actions
   - Click "New repository secret"
   - Name: `SLACK_WEBHOOK_URL`
   - Value: Your webhook URL from step 2

### **Alternative: Disable Slack Notifications**

If you don't want Slack notifications, you can modify the workflow to skip the notification steps:

```yaml
# In .github/workflows/deploy-staging.yml, add condition:
if: false && needs.performance-tests.result == 'success'
```

## **🎯 Expected Deployment URLs**

After successful deployment, your services will be available at:

```
Frontend:     https://sabs-v2-frontend-[hash]-uc.a.run.app
Identity:     https://sabs-v2-identity-service-[hash]-uc.a.run.app  
Company:      https://sabs-v2-company-service-[hash]-uc.a.run.app
Accounts:     https://sabs-v2-accounts-service-[hash]-uc.a.run.app
Mobile:       https://sabs-v2-mobile-service-[hash]-uc.a.run.app
```

## **📋 Current Status**

- ✅ ESLint errors fixed (warnings only)
- ✅ Terraform formatting corrected
- ⚠️ Slack webhook needs configuration
- 🚀 Ready for deployment once webhook is configured

## **🔍 Troubleshooting**

If deployment still fails:

1. Check GitHub Actions logs
2. Verify all GCP secrets are configured:
   - `GCP_PROJECT_ID`
   - `GCP_SA_KEY`
   - `TERRAFORM_STATE_BUCKET`
3. Ensure GCP service account has required permissions
4. Check Cloud Run quotas and limits