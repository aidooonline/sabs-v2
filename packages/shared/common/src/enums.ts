export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  COMPANY_ADMIN = 'company_admin',
  CLERK = 'clerk',
  FIELD_AGENT = 'field_agent',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  COMMISSION = 'commission',
  REVERSAL = 'reversal',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

export enum CompanyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

// ============================
// RBAC Enums for Story 2.4
// ============================

/**
 * Core resources in the system that can have permissions applied
 */
export enum Resource {
  // Company Management
  COMPANY = 'company',
  COMPANY_SETTINGS = 'company_settings',
  SERVICE_CREDITS = 'service_credits',
  
  // User Management
  USER = 'user',
  STAFF = 'staff',
  PROFILE = 'profile',
  
  // Authentication & Security
  AUTHENTICATION = 'authentication',
  MFA = 'mfa',
  SESSION = 'session',
  AUDIT_LOG = 'audit_log',
  
  // Financial Operations
  TRANSACTION = 'transaction',
  CUSTOMER = 'customer',
  ACCOUNT = 'account',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
  COMMISSION = 'commission',
  
  // Cash Management
  FLOAT = 'float',
  RECONCILIATION = 'reconciliation',
  CASH_COLLECTION = 'cash_collection',
  
  // Reporting & Analytics
  REPORT = 'report',
  DASHBOARD = 'dashboard',
  ANALYTICS = 'analytics',
  
  // System Administration
  SYSTEM_SETTINGS = 'system_settings',
  PLATFORM_CONFIG = 'platform_config',
  
  // Loans & AI (Future)
  LOAN = 'loan',
  AI_ASSISTANT = 'ai_assistant',
  
  // Notifications
  NOTIFICATION = 'notification',
  SMS_CREDITS = 'sms_credits',
}

/**
 * Actions that can be performed on resources
 */
export enum Action {
  // Basic CRUD operations
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  
  // Extended operations
  LIST = 'list',
  SEARCH = 'search',
  EXPORT = 'export',
  IMPORT = 'import',
  
  // Financial operations
  APPROVE = 'approve',
  REJECT = 'reject',
  PROCESS = 'process',
  REVERSE = 'reverse',
  RECONCILE = 'reconcile',
  
  // User management
  INVITE = 'invite',
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
  RESET_PASSWORD = 'reset_password',
  
  // Administrative
  CONFIGURE = 'configure',
  MONITOR = 'monitor',
  AUDIT = 'audit',
  MANAGE = 'manage',
  
  // Specialized actions
  PRINT = 'print',
  DOWNLOAD = 'download',
  UPLOAD = 'upload',
  SHARE = 'share',
  ASSIGN = 'assign',
  
  // Security actions
  GRANT_PERMISSION = 'grant_permission',
  REVOKE_PERMISSION = 'revoke_permission',
  VIEW_LOGS = 'view_logs',
}

/**
 * Permission scopes for multi-tenant and hierarchical access
 */
export enum PermissionScope {
  GLOBAL = 'global',           // Platform-wide access (Super Admin)
  COMPANY = 'company',         // Company-specific access
  DEPARTMENT = 'department',   // Department/team-specific access  
  PERSONAL = 'personal',       // Personal/own resources only
  ASSIGNED = 'assigned',       // Explicitly assigned resources
}

/**
 * Permission effects for policy-based access control
 */
export enum PermissionEffect {
  ALLOW = 'allow',
  DENY = 'deny',
}

/**
 * Policy condition operators
 */
export enum PolicyCondition {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  IN = 'in',
  NOT_IN = 'not_in',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  EXISTS = 'exists',
  NOT_EXISTS = 'not_exists',
  TIME_BETWEEN = 'time_between',
  IP_IN_RANGE = 'ip_in_range',
  HAS_ROLE = 'has_role',
  IS_OWNER = 'is_owner',
  SAME_COMPANY = 'same_company',
}

/**
 * Context types for permission evaluation
 */
export enum ContextType {
  USER = 'user',
  COMPANY = 'company',
  RESOURCE = 'resource',
  REQUEST = 'request',
  TIME = 'time',
  LOCATION = 'location',
  SESSION = 'session',
}

/**
 * Audit log categories for RBAC events
 */
export enum RbacAuditCategory {
  PERMISSION_GRANTED = 'permission_granted',
  PERMISSION_DENIED = 'permission_denied',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REMOVED = 'role_removed',
  POLICY_CREATED = 'policy_created',
  POLICY_UPDATED = 'policy_updated',
  POLICY_DELETED = 'policy_deleted',
  ACCESS_ATTEMPT = 'access_attempt',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
}

/**
 * Pre-defined permission combinations for common use cases
 */
export enum StandardPermission {
  // Company management permissions
  COMPANY_FULL_ACCESS = 'company:*:*',
  COMPANY_READ_ONLY = 'company:read:company',
  COMPANY_SETTINGS_MANAGE = 'company_settings:*:company',
  
  // Staff management permissions
  STAFF_FULL_MANAGE = 'staff:*:company',
  STAFF_READ_ONLY = 'staff:read:company',
  STAFF_CREATE_AGENT = 'staff:create:company',
  
  // Transaction permissions
  TRANSACTION_FULL_ACCESS = 'transaction:*:company',
  TRANSACTION_PROCESS = 'transaction:process:company',
  TRANSACTION_READ_ONLY = 'transaction:read:personal',
  
  // Customer management
  CUSTOMER_FULL_MANAGE = 'customer:*:company',
  CUSTOMER_CREATE = 'customer:create:personal',
  CUSTOMER_READ_ASSIGNED = 'customer:read:assigned',
  
  // Financial operations
  WITHDRAWAL_APPROVE = 'withdrawal:approve:company',
  WITHDRAWAL_PROCESS = 'withdrawal:process:personal',
  DEPOSIT_PROCESS = 'deposit:process:personal',
  
  // Cash management
  CASH_RECONCILE = 'reconciliation:*:company',
  FLOAT_MANAGE = 'float:*:company',
  
  // Reporting and analytics
  REPORTS_VIEW_ALL = 'report:read:company',
  REPORTS_VIEW_PERSONAL = 'report:read:personal',
  DASHBOARD_VIEW = 'dashboard:read:company',
  
  // System administration (Super Admin only)
  SYSTEM_FULL_ACCESS = 'system_settings:*:global',
  PLATFORM_CONFIG = 'platform_config:*:global',
  AUDIT_VIEW_ALL = 'audit_log:read:global',
  
  // Security permissions
  MFA_MANAGE_OTHERS = 'mfa:manage:company',
  SESSION_MANAGE_OTHERS = 'session:manage:company',
  USER_SECURITY_MANAGE = 'authentication:manage:company',
}