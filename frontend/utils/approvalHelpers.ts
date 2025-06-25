import type {
  ApprovalWorkflow,
  WorkflowStatus,
  ApprovalStage,
  ApprovalPriority,
  RiskLevel,
  ApprovalAction,
  WorkflowFilterOptions,
  SortOption
} from '../types/approval';

// ===== STATUS AND STAGE FORMATTING =====

export const getStatusLabel = (status: WorkflowStatus): string => {
  const statusLabels: Record<WorkflowStatus, string> = {
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    escalated: 'Escalated',
    canceled: 'Canceled',
    expired: 'Expired'
  };
  return statusLabels[status] || status;
};

export const getStatusColor = (status: WorkflowStatus): string => {
  const statusColors: Record<WorkflowStatus, string> = {
    pending: 'text-warning-700 bg-warning-50 border-warning-200',
    approved: 'text-success-700 bg-success-50 border-success-200',
    rejected: 'text-danger-700 bg-danger-50 border-danger-200',
    escalated: 'text-purple-700 bg-purple-50 border-purple-200',
    canceled: 'text-gray-700 bg-gray-50 border-gray-200',
    expired: 'text-gray-700 bg-gray-50 border-gray-200'
  };
  return statusColors[status] || 'text-gray-700 bg-gray-50 border-gray-200';
};

export const getStageLabel = (stage: ApprovalStage): string => {
  const stageLabels: Record<ApprovalStage, string> = {
    clerk_review: 'Clerk Review',
    manager_review: 'Manager Review',
    admin_review: 'Admin Review',
    final_authorization: 'Final Authorization',
    completed: 'Completed'
  };
  return stageLabels[stage] || stage;
};

export const getPriorityLabel = (priority: ApprovalPriority): string => {
  const priorityLabels: Record<ApprovalPriority, string> = {
    low: 'Low Priority',
    medium: 'Medium Priority',
    high: 'High Priority',
    urgent: 'Urgent',
    critical: 'Critical'
  };
  return priorityLabels[priority] || priority;
};

export const getPriorityColor = (priority: ApprovalPriority): string => {
  const priorityColors: Record<ApprovalPriority, string> = {
    low: 'text-gray-600',
    medium: 'text-warning-600',
    high: 'text-orange-600',
    urgent: 'text-red-600',
    critical: 'text-red-800'
  };
  return priorityColors[priority] || 'text-gray-600';
};

export const getRiskLevelLabel = (riskLevel: RiskLevel): string => {
  const riskLabels: Record<RiskLevel, string> = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    critical: 'Critical Risk'
  };
  return riskLabels[riskLevel] || riskLevel;
};

export const getRiskLevelColor = (riskLevel: RiskLevel): string => {
  const riskColors: Record<RiskLevel, string> = {
    low: 'text-success-600',
    medium: 'text-warning-600',
    high: 'text-orange-600',
    critical: 'text-red-600'
  };
  return riskColors[riskLevel] || 'text-gray-600';
};

// ===== WORKFLOW VALIDATION =====

export const isWorkflowActionAllowed = (
  workflow: ApprovalWorkflow,
  action: ApprovalAction,
  userRole: string
): boolean => {
  // Check if workflow is in a state that allows actions
  if (['approved', 'rejected', 'canceled', 'expired'].includes(workflow.status)) {
    return action === 'override' && ['admin', 'super_admin'].includes(userRole);
  }

  // Stage-based action permissions
  switch (workflow.currentStage) {
    case 'clerk_review':
      return ['clerk', 'manager', 'admin', 'super_admin'].includes(userRole);
    
    case 'manager_review':
      return ['manager', 'admin', 'super_admin'].includes(userRole);
    
    case 'admin_review':
      return ['admin', 'super_admin'].includes(userRole);
    
    case 'final_authorization':
      return ['admin', 'super_admin'].includes(userRole);
    
    default:
      return false;
  }
};

export const getAvailableActions = (
  workflow: ApprovalWorkflow,
  userRole: string
): ApprovalAction[] => {
  const allActions: ApprovalAction[] = [
    'approve',
    'reject',
    'escalate',
    'request_info',
    'conditional_approve',
    'override'
  ];

  return allActions.filter(action => 
    isWorkflowActionAllowed(workflow, action, userRole)
  );
};

export const validateWorkflowDecision = (
  action: ApprovalAction,
  notes: string,
  conditions?: string[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Notes validation
  if (!notes || notes.trim().length < 10) {
    errors.push('Decision notes must be at least 10 characters long');
  }

  // Conditional approval validation
  if (action === 'conditional_approve') {
    if (!conditions || conditions.length === 0) {
      errors.push('Conditional approval requires at least one condition');
    }
  }

  // Escalation validation
  if (action === 'escalate') {
    if (notes.trim().length < 20) {
      errors.push('Escalation requires detailed reasoning (minimum 20 characters)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ===== WORKFLOW CALCULATIONS =====

export const calculateWorkflowUrgency = (workflow: ApprovalWorkflow): number => {
  let urgencyScore = 0;

  // Time-based urgency
  const dueDate = new Date(workflow.dueDate);
  const now = new Date();
  const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilDue < 2) urgencyScore += 50;
  else if (hoursUntilDue < 6) urgencyScore += 30;
  else if (hoursUntilDue < 24) urgencyScore += 15;

  // Amount-based urgency
  const amount = workflow.withdrawalRequest.amount;
  if (amount >= 10000) urgencyScore += 20;
  else if (amount >= 5000) urgencyScore += 10;
  else if (amount >= 1000) urgencyScore += 5;

  // Risk-based urgency
  const riskScore = workflow.riskAssessment.riskScore;
  if (riskScore >= 80) urgencyScore += 25;
  else if (riskScore >= 60) urgencyScore += 15;
  else if (riskScore >= 40) urgencyScore += 10;

  // Priority-based urgency
  const priorityScores: Record<ApprovalPriority, number> = {
    critical: 40,
    urgent: 30,
    high: 20,
    medium: 10,
    low: 0
  };
  urgencyScore += priorityScores[workflow.priority] || 0;

  return Math.min(urgencyScore, 100);
};

export const calculateSLAStatus = (workflow: ApprovalWorkflow): {
  status: 'on_track' | 'at_risk' | 'breached';
  timeRemaining: number;
  percentageUsed: number;
} => {
  const dueDate = new Date(workflow.dueDate);
  const createdDate = new Date(workflow.createdAt);
  const now = new Date();

  const totalSLATime = dueDate.getTime() - createdDate.getTime();
  const timeUsed = now.getTime() - createdDate.getTime();
  const timeRemaining = dueDate.getTime() - now.getTime();
  const percentageUsed = (timeUsed / totalSLATime) * 100;

  let status: 'on_track' | 'at_risk' | 'breached';
  if (percentageUsed >= 100) {
    status = 'breached';
  } else if (percentageUsed >= 80) {
    status = 'at_risk';
  } else {
    status = 'on_track';
  }

  return {
    status,
    timeRemaining: Math.max(timeRemaining, 0),
    percentageUsed: Math.min(percentageUsed, 100)
  };
};

// ===== FORMATTING UTILITIES =====

export const formatCurrency = (amount: number, currency = 'GHS'): string => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = (now.getTime() - targetDate.getTime()) / 1000;

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else {
    return targetDate.toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
};

// ===== FILTER AND SORT UTILITIES =====

export const getWorkflowFilterOptions = (): WorkflowFilterOptions => ({
  status: [
    { label: 'Pending Review', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Escalated', value: 'escalated' },
    { label: 'Canceled', value: 'canceled' },
    { label: 'Expired', value: 'expired' }
  ],
  stage: [
    { label: 'Clerk Review', value: 'clerk_review' },
    { label: 'Manager Review', value: 'manager_review' },
    { label: 'Admin Review', value: 'admin_review' },
    { label: 'Final Authorization', value: 'final_authorization' },
    { label: 'Completed', value: 'completed' }
  ],
  priority: [
    { label: 'Critical', value: 'critical' },
    { label: 'Urgent', value: 'urgent' },
    { label: 'High Priority', value: 'high' },
    { label: 'Medium Priority', value: 'medium' },
    { label: 'Low Priority', value: 'low' }
  ],
  riskLevel: [
    { label: 'Critical Risk', value: 'critical' },
    { label: 'High Risk', value: 'high' },
    { label: 'Medium Risk', value: 'medium' },
    { label: 'Low Risk', value: 'low' }
  ]
});

export const getSortOptions = (): SortOption[] => [
  { label: 'Newest First', value: 'createdAt', order: 'DESC' },
  { label: 'Oldest First', value: 'createdAt', order: 'ASC' },
  { label: 'Due Date (Urgent First)', value: 'dueDate', order: 'ASC' },
  { label: 'Amount (High to Low)', value: 'amount', order: 'DESC' },
  { label: 'Amount (Low to High)', value: 'amount', order: 'ASC' },
  { label: 'Priority (High to Low)', value: 'priority', order: 'DESC' },
  { label: 'Risk Level (High to Low)', value: 'riskScore', order: 'DESC' }
];

// ===== SEARCH AND MATCHING =====

export const searchWorkflows = (
  workflows: ApprovalWorkflow[],
  searchTerm: string
): ApprovalWorkflow[] => {
  if (!searchTerm.trim()) return workflows;

  const term = searchTerm.toLowerCase();
  
  return workflows.filter(workflow => 
    workflow.workflowNumber.toLowerCase().includes(term) ||
    workflow.withdrawalRequest.customer.fullName.toLowerCase().includes(term) ||
    workflow.withdrawalRequest.customer.accountNumber.toLowerCase().includes(term) ||
    workflow.withdrawalRequest.agent.fullName.toLowerCase().includes(term) ||
    formatCurrency(workflow.withdrawalRequest.amount).toLowerCase().includes(term)
  );
};

// ===== URL AND NAVIGATION HELPERS =====

export const getWorkflowDetailUrl = (workflowId: string): string => {
  return `/approval/review/${workflowId}`;
};

export const getWorkflowShareUrl = (workflowId: string): string => {
  return `${window.location.origin}/approval/review/${workflowId}`;
};

// ===== LOCAL STORAGE HELPERS =====

export const saveWorkflowFilters = (filters: Record<string, any>): void => {
  try {
    localStorage.setItem('approval_workflow_filters', JSON.stringify(filters));
  } catch (error) {
    console.warn('Failed to save workflow filters to localStorage:', error);
  }
};

export const loadWorkflowFilters = (): Record<string, any> | null => {
  try {
    const saved = localStorage.getItem('approval_workflow_filters');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Failed to load workflow filters from localStorage:', error);
    return null;
  }
};

export const clearWorkflowFilters = (): void => {
  try {
    localStorage.removeItem('approval_workflow_filters');
  } catch (error) {
    console.warn('Failed to clear workflow filters from localStorage:', error);
  }
};