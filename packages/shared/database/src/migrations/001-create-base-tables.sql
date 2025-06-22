-- Migration: 001-create-base-tables.sql
-- Description: Create foundational tables for Sabs v2 multi-tenant architecture
-- Author: Sabs v2 Development Team
-- Date: 2024-01-01

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create enum types
CREATE TYPE user_role AS ENUM ('super_admin', 'company_admin', 'clerk', 'field_agent');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE company_status AS ENUM ('active', 'inactive', 'suspended', 'trial');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'commission', 'reversal', 'fee');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'reversed', 'cancelled');

-- Companies table (Multi-tenant root)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    country_code VARCHAR(3) DEFAULT 'GH',
    currency VARCHAR(3) DEFAULT 'GHS',
    timezone VARCHAR(50) DEFAULT 'Africa/Accra',
    status company_status DEFAULT 'trial',
    settings JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Service credits
    sms_credits INTEGER DEFAULT 0,
    ai_credits INTEGER DEFAULT 0,
    
    -- Commission settings
    commission_rates JSONB DEFAULT '{"deposit": 0.02, "withdrawal": 0.03}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table (Multi-tenant with company_id)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    role user_role NOT NULL,
    status user_status DEFAULT 'pending',
    
    -- Agent-specific fields
    agent_code VARCHAR(20),
    location JSONB, -- {lat, lng, address}
    
    -- Authentication
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(company_id, email),
    UNIQUE(company_id, agent_code)
);

-- Customers table (Multi-tenant)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_number VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    id_type VARCHAR(50), -- 'national_id', 'passport', 'driver_license'
    id_number VARCHAR(100),
    
    -- KYC information
    kyc_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    kyc_verified_at TIMESTAMP WITH TIME ZONE,
    kyc_documents JSONB DEFAULT '[]',
    
    -- Account information
    balance DECIMAL(15,2) DEFAULT 0.00,
    account_status VARCHAR(20) DEFAULT 'active',
    
    -- Agent relationship
    created_by_agent_id UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(company_id, customer_number),
    UNIQUE(company_id, phone)
);

-- Transactions table (Multi-tenant)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reference VARCHAR(100) NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    agent_id UUID NOT NULL REFERENCES users(id),
    
    type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    fee DECIMAL(15,2) DEFAULT 0.00,
    commission DECIMAL(15,2) DEFAULT 0.00,
    
    status transaction_status DEFAULT 'pending',
    description TEXT,
    
    -- Balance tracking
    balance_before DECIMAL(15,2),
    balance_after DECIMAL(15,2),
    
    -- Location and device info
    location JSONB,
    device_info JSONB,
    
    -- Approval workflow
    approved_by_user_id UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Reversal information
    reversed_transaction_id UUID REFERENCES transactions(id),
    reversal_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(company_id, reference)
);

-- Agent cash reconciliation
CREATE TABLE cash_reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES users(id),
    clerk_id UUID NOT NULL REFERENCES users(id),
    
    reconciliation_date DATE NOT NULL,
    opening_balance DECIMAL(15,2) NOT NULL,
    closing_balance DECIMAL(15,2) NOT NULL,
    total_deposits DECIMAL(15,2) DEFAULT 0.00,
    total_withdrawals DECIMAL(15,2) DEFAULT 0.00,
    total_commissions DECIMAL(15,2) DEFAULT 0.00,
    cash_collected DECIMAL(15,2) DEFAULT 0.00,
    float_issued DECIMAL(15,2) DEFAULT 0.00,
    
    discrepancy DECIMAL(15,2) DEFAULT 0.00,
    discrepancy_reason TEXT,
    
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'disputed'
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(company_id, agent_id, reconciliation_date)
);

-- Service usage tracking (for billing)
CREATE TABLE service_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL, -- 'sms', 'ai_query', 'transaction_processing'
    quantity INTEGER NOT NULL DEFAULT 1,
    cost DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    
    -- Service-specific metadata
    metadata JSONB DEFAULT '{}',
    
    -- Reference to related entities
    user_id UUID REFERENCES users(id),
    transaction_id UUID REFERENCES transactions(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for all changes
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System configuration
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_customer_number ON customers(customer_number);
CREATE INDEX idx_customers_created_by_agent ON customers(created_by_agent_id);

CREATE INDEX idx_transactions_company_id ON transactions(company_id);
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transactions_agent_id ON transactions(agent_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_reference ON transactions(reference);

CREATE INDEX idx_cash_reconciliations_company_id ON cash_reconciliations(company_id);
CREATE INDEX idx_cash_reconciliations_agent_id ON cash_reconciliations(agent_id);
CREATE INDEX idx_cash_reconciliations_date ON cash_reconciliations(reconciliation_date);

CREATE INDEX idx_service_usage_company_id ON service_usage(company_id);
CREATE INDEX idx_service_usage_service_type ON service_usage(service_type);
CREATE INDEX idx_service_usage_created_at ON service_usage(created_at);

CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_reconciliations_updated_at BEFORE UPDATE ON cash_reconciliations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial system configuration
INSERT INTO system_config (key, value, description) VALUES
('platform.version', '"2.0.0"', 'Current platform version'),
('platform.maintenance_mode', 'false', 'Platform maintenance mode flag'),
('security.max_login_attempts', '5', 'Maximum login attempts before lockout'),
('security.lockout_duration_minutes', '30', 'Account lockout duration in minutes'),
('transactions.daily_limit_amount', '50000.00', 'Daily transaction limit per customer'),
('transactions.require_approval_above', '10000.00', 'Amount above which transactions require approval'),
('notifications.sms_enabled', 'true', 'Enable SMS notifications'),
('features.ai_assistant_enabled', 'true', 'Enable AI assistant features'),
('features.advanced_analytics_enabled', 'false', 'Enable advanced analytics features');

COMMIT;