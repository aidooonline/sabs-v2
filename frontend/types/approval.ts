// ===== CORE APPROVAL WORKFLOW INTERFACES =====

/**
 * Approval workflow status enums
 */
export type WorkflowStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'escalated'
  | 'canceled'
  | 'expired';

export type ApprovalStage = 
  | 'clerk_review'
  | 'manager_review'
  | 'admin_review'
  | 'final_authorization'
  | 'completed';

export type ApprovalPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'
  | 'critical';

export type ApprovalAction = 
  | 'approve'
  | 'reject'
  | 'escalate'
  | 'request_info'
  | 'conditional_approve'
  | 'override';

export type RiskLevel = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

/**
 * Main approval workflow interface
 */
export interface ApprovalWorkflow {
  id: string;
  workflowNumber: string;
  companyId: string;
  status: WorkflowStatus;
  currentStage: ApprovalStage;
  priority: ApprovalPriority;
  
  // Workflow metadata
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  escalationDate?: string;
  completedAt?: string;
  description?: string;
  
  // Withdrawal request details
  withdrawalRequest: WithdrawalRequest;
  
  // Approver information
  currentApprover?: string;
  approvalHistory: ApprovalDecision[];
  
  // Risk and compliance
  riskAssessment: RiskAssessment;
  complianceFlags: ComplianceFlag[];
  
  // SLA and tracking
  slaMetrics: SLAMetrics;
  
  // Comments and collaboration
  comments: WorkflowComment[];
  
  // Audit trail
  auditLog: AuditLogEntry[];
}

/**
 * Withdrawal request details
 */
export interface WithdrawalRequest {
  id: string;
  amount: number;
  currency: string;
  requestedAt: string;
  
  // Customer information
  customer: CustomerInfo;
  
  // Agent information
  agent: AgentInfo;
  
  // Transaction context
  transactionContext: TransactionContext;
  
  // Supporting documents
  documents: SupportingDocument[];
  
  // Location and security
  location: LocationInfo;
  deviceInfo: DeviceInfo;
}

/**
 * Customer information interface
 */
export interface CustomerInfo {
  id: string;
  fullName: string;
  accountNumber: string;
  phoneNumber: string;
  email?: string;
  
  // Verification details
  idType: string;
  idNumber: string;
  photoUrl?: string;
  
  // Account status
  accountStatus: 'active' | 'suspended' | 'blocked';
  accountBalance: number;
  
  // Transaction history
  recentTransactions: Transaction[];
  
  // Risk profile
  riskProfile: CustomerRiskProfile;
}

/**
 * Agent information interface
 */
export interface AgentInfo {
  id: string;
  fullName: string;
  employeeId: string;
  companyId: string;
  
  // Contact information
  phoneNumber: string;
  email: string;
  
  // Performance metrics
  performanceMetrics: AgentPerformanceMetrics;
  
  // Location and tracking
  currentLocation: LocationInfo;
  locationHistory: LocationHistory[];
  
  // Status and verification
  status: 'active' | 'inactive' | 'suspended';
  verificationStatus: 'verified' | 'pending' | 'rejected';
}

/**
 * Transaction context information
 */
export interface TransactionContext {
  recentActivity: Transaction[];
  spendingPatterns: SpendingPattern[];
  accountActivity: AccountActivity;
  relatedTransactions: Transaction[];
}

/**
 * Transaction interface
 */
export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  currency: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed' | 'reversed';
  description: string;
  category?: string;
  location?: LocationInfo;
  agent?: string;
}

/**
 * Risk assessment interface
 */
export interface RiskAssessment {
  overallRisk: RiskLevel;
  riskScore: number;
  riskFactors: RiskFactor[];
  complianceChecks: ComplianceCheck[];
  fraudIndicators: FraudIndicator[];
  recommendations: string[];
}

export interface RiskFactor {
  factor: string;
  severity: RiskLevel;
  description: string;
  weight: number;
}

export interface ComplianceCheck {
  checkName: string;
  status: 'passed' | 'failed' | 'warning';
  details: string;
  regulatoryRequirement?: string;
}

export interface FraudIndicator {
  indicator: string;
  severity: RiskLevel;
  description: string;
  recommendation: string;
}

/**
 * Compliance flag interface
 */
export interface ComplianceFlag {
  id: string;
  type: 'regulatory' | 'internal' | 'risk' | 'fraud';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  requirement?: string;
  resolutionRequired: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

/**
 * Approval decision interface
 */
export interface ApprovalDecision {
  id: string;
  workflowId: string;
  stage: ApprovalStage;
  action: ApprovalAction;
  approverId: string;
  approverName: string;
  approverRole: string;
  
  // Decision details
  timestamp: string;
  notes: string;
  conditions?: string[];
  
  // Authorization details
  authorizationMethod: 'pin' | 'otp' | 'biometric' | 'digital_signature';
  authorizationCode?: string;
  
  // Audit information
  ipAddress: string;
  deviceInfo: DeviceInfo;
  sessionInfo: SessionInfo;
}

/**
 * SLA metrics interface
 */
export interface SLAMetrics {
  createdAt: string;
  targetCompletionTime: string;
  actualCompletionTime?: string;
  timeInCurrentStage: number;
  totalProcessingTime: number;
  slaStatus: 'on_track' | 'at_risk' | 'breached';
  escalationTriggers: EscalationTrigger[];
}

export interface EscalationTrigger {
  condition: string;
  triggeredAt?: string;
  action: 'escalate' | 'notify' | 'reassign';
  targetRole: string;
}

/**
 * Workflow comment interface
 */
export interface WorkflowComment {
  id: string;
  workflowId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  timestamp: string;
  isInternal: boolean;
  mentions: string[];
  attachments: CommentAttachment[];
}

export interface CommentAttachment {
  id: string;
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

/**
 * Supporting document interface
 */
export interface SupportingDocument {
  id: string;
  type: 'id_card' | 'receipt' | 'photo' | 'signature' | 'other';
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

/**
 * Location and device information
 */
export interface LocationInfo {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  accuracy?: number;
  timestamp: string;
}

export interface DeviceInfo {
  deviceId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  platform: string;
  browser?: string;
  version?: string;
  ipAddress: string;
  userAgent: string;
}

export interface SessionInfo {
  sessionId: string;
  loginTime: string;
  lastActivity: string;
  ipAddress: string;
  location?: LocationInfo;
}

/**
 * Audit log interface
 */
export interface AuditLogEntry {
  id: string;
  workflowId: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: Record<string, any>;
  ipAddress: string;
  deviceInfo: DeviceInfo;
  sessionInfo: SessionInfo;
}

// ===== CUSTOMER AND AGENT DETAILS =====

export interface CustomerRiskProfile {
  riskLevel: RiskLevel;
  creditScore?: number;
  transactionPatterns: TransactionPattern[];
  riskFactors: string[];
  lastAssessment: string;
}

export interface TransactionPattern {
  pattern: string;
  frequency: number;
  averageAmount: number;
  typicalTime: string;
  riskScore: number;
}

export interface AgentPerformanceMetrics {
  totalTransactions: number;
  approvalRate: number;
  averageProcessingTime: number;
  customerSatisfaction: number;
  complianceScore: number;
  lastEvaluation: string;
}

export interface LocationHistory {
  timestamp: string;
  location: LocationInfo;
  activity: string;
  duration: number;
}

export interface SpendingPattern {
  category: string;
  averageAmount: number;
  frequency: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  lastTransactionDate: string;
}

export interface AccountActivity {
  lastLoginDate: string;
  transactionFrequency: number;
  averageTransactionAmount: number;
  accountAge: number;
  statusChanges: AccountStatusChange[];
}

export interface AccountStatusChange {
  fromStatus: string;
  toStatus: string;
  changedAt: string;
  changedBy: string;
  reason: string;
}

// ===== API REQUEST AND RESPONSE INTERFACES =====

/**
 * API request interfaces
 */
export interface ApprovalWorkflowQuery {
  page?: number;
  limit?: number;
  status?: WorkflowStatus[];
  stage?: ApprovalStage[];
  priority?: ApprovalPriority[];
  assignedTo?: string;
  companyId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  riskLevel?: RiskLevel[];
  sortBy?: 'createdAt' | 'dueDate' | 'amount' | 'priority' | 'riskScore';
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

export interface ApprovalDecisionRequest {
  workflowId: string;
  action: ApprovalAction;
  notes: string;
  conditions?: string[];
  authorizationMethod: 'pin' | 'otp' | 'biometric' | 'digital_signature';
  authorizationCode: string;
  escalationReason?: string;
  reassignTo?: string;
}

export interface BulkApprovalRequest {
  workflowIds: string[];
  action: ApprovalAction;
  notes: string;
  authorizationMethod: 'pin' | 'otp' | 'digital_signature';
  authorizationCode: string;
}

export interface EscalationRequest {
  workflowId: string;
  reason: string;
  escalateTo: string;
  priority?: ApprovalPriority;
  notes?: string;
}

export interface CommentRequest {
  workflowId: string;
  content: string;
  isInternal: boolean;
  mentions?: string[];
  attachments?: File[];
}

/**
 * API response interfaces
 */
export interface ApprovalWorkflowListResponse {
  workflows: ApprovalWorkflow[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  summary: {
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    totalEscalated: number;
    averageProcessingTime: number;
  };
}

export interface ApprovalWorkflowResponse {
  workflow: ApprovalWorkflow;
  availableActions: ApprovalAction[];
  permissions: WorkflowPermissions;
}

export interface WorkflowPermissions {
  canApprove: boolean;
  canReject: boolean;
  canEscalate: boolean;
  canReassign: boolean;
  canOverride: boolean;
  canComment: boolean;
  canViewAudit: boolean;
  canExport: boolean;
}

export interface ApprovalDecisionResponse {
  success: boolean;
  message: string;
  workflow: ApprovalWorkflow;
  nextStage?: ApprovalStage;
  authorizationCode?: string;
  notifications: NotificationInfo[];
}

export interface NotificationInfo {
  type: 'email' | 'sms' | 'push' | 'internal';
  recipient: string;
  message: string;
  sentAt: string;
}

export interface DashboardStatsResponse {
  queueStats: {
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    totalEscalated: number;
    averageProcessingTime: number;
    slaCompliance: number;
  };
  performanceMetrics: {
    approvalsToday: number;
    approvalsThisWeek: number;
    approvalsThisMonth: number;
    averageApprovalTime: number;
    escalationRate: number;
  };
  riskMetrics: {
    highRiskPending: number;
    fraudFlagged: number;
    complianceIssues: number;
    riskDistribution: RiskDistribution[];
  };
  userMetrics: {
    activeApprovers: number;
    workloadDistribution: WorkloadDistribution[];
    topPerformers: UserPerformance[];
  };
}

export interface RiskDistribution {
  riskLevel: RiskLevel;
  count: number;
  percentage: number;
}

export interface WorkloadDistribution {
  userId: string;
  userName: string;
  pendingCount: number;
  completedToday: number;
  averageProcessingTime: number;
}

export interface UserPerformance {
  userId: string;
  userName: string;
  completedCount: number;
  averageProcessingTime: number;
  accuracyRate: number;
  complianceScore: number;
}

// ===== WEBSOCKET INTERFACES =====

export interface WebSocketMessage {
  type: 'workflow_update' | 'new_workflow' | 'comment_added' | 'escalation' | 'assignment';
  data: any;
  timestamp: string;
  userId?: string;
}

export interface WorkflowUpdateMessage {
  workflowId: string;
  status: WorkflowStatus;
  stage: ApprovalStage;
  updatedBy: string;
  changes: Record<string, any>;
}

// ===== UTILITY TYPES =====

export type WorkflowFilterOptions = {
  status: { label: string; value: WorkflowStatus }[];
  stage: { label: string; value: ApprovalStage }[];
  priority: { label: string; value: ApprovalPriority }[];
  riskLevel: { label: string; value: RiskLevel }[];
};

export type SortOption = {
  label: string;
  value: string;
  order: 'ASC' | 'DESC';
};

export type BulkActionType = 'approve' | 'reject' | 'escalate' | 'reassign' | 'export';

export interface BulkActionOption {
  type: BulkActionType;
  label: string;
  icon: string;
  requiresAuth: boolean;
  requiresNotes: boolean;
  confirmationMessage: string;
}