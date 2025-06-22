-- Initialize Sabs v2 Database
-- This script sets up the basic database structure and seed data

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a basic company for development
INSERT INTO companies (id, name, email, phone, address, status, settings, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Development Company',
  'dev@sabs.com',
  '+233123456789',
  'Accra, Ghana',
  'active',
  '{"currency": "GHS", "timezone": "Africa/Accra", "commissionRates": {"deposit": 0.02, "withdrawal": 0.03}, "smsCredits": 1000, "aiCredits": 500}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_transaction_company_id ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transaction_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transaction_type ON transactions(type);

-- Log successful initialization
INSERT INTO system_logs (message, created_at) 
VALUES ('Database initialized successfully', NOW());

COMMIT;