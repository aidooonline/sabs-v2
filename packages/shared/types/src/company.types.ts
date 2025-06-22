export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive' | 'suspended';
  settings: CompanySettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanySettings {
  currency: string;
  timezone: string;
  commissionRates: {
    deposit: number;
    withdrawal: number;
  };
  smsCredits: number;
  aiCredits: number;
}