export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TransactionRequest {
  customerId: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  description?: string;
}