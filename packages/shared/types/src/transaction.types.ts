export interface Transaction {
  id: string;
  companyId: string;
  customerId: string;
  agentId: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'commission' | 'reversal';
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  description?: string;
  reference: string;
  createdAt: Date;
  updatedAt: Date;
}