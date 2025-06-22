-- Legacy Sabs Database Initialization Script
-- This creates sample data that mimics the legacy system structure

USE sabs_legacy;

-- Companies table (legacy structure)
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TINYINT DEFAULT 1 -- 1=active, 0=inactive, -1=suspended
);

-- Users table (legacy structure)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL,
    agent_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TINYINT DEFAULT 1,
    
    INDEX idx_company_id (company_id),
    INDEX idx_email (email),
    INDEX idx_agent_code (agent_code)
);

-- Customers table (legacy structure)
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    customer_number VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    balance DECIMAL(15,2) DEFAULT 0.00,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TINYINT DEFAULT 1,
    
    INDEX idx_company_id (company_id),
    INDEX idx_customer_number (customer_number),
    INDEX idx_phone (phone),
    INDEX idx_created_by (created_by)
);

-- Transactions table (legacy structure)
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    customer_id INT NOT NULL,
    agent_id INT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    fee DECIMAL(15,2) DEFAULT 0.00,
    commission DECIMAL(15,2) DEFAULT 0.00,
    balance_before DECIMAL(15,2),
    balance_after DECIMAL(15,2),
    reference VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_company_id (company_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_agent_id (agent_id),
    INDEX idx_reference (reference),
    INDEX idx_created_at (created_at)
);

-- Insert sample companies
INSERT INTO companies (company_name, email, phone, address, status) VALUES
('Accra Financial Services', 'admin@accrafinancial.com', '+233244123456', '123 Independence Ave, Accra', 1),
('Kumasi Micro Credit', 'info@kumasimicro.com', '+233244789012', '45 Kejetia Market, Kumasi', 1),
('Tamale Rural Bank', 'contact@tamalebank.com', '+233244345678', '12 Hospital Road, Tamale', 1);

-- Insert sample users
INSERT INTO users (company_id, name, email, password, phone, role, agent_code, status) VALUES
-- Accra Financial Services users
(1, 'John Doe', 'john@accrafinancial.com', '$2b$12$hash1', '+233244111111', 'admin', NULL, 1),
(1, 'Mary Smith', 'mary@accrafinancial.com', '$2b$12$hash2', '+233244222222', 'clerk', NULL, 1),
(1, 'Emmanuel Asante', 'emmanuel@accrafinancial.com', '$2b$12$hash3', '+233244333333', 'agent', 'AG001', 1),
(1, 'Grace Osei', 'grace@accrafinancial.com', '$2b$12$hash4', '+233244444444', 'agent', 'AG002', 1),

-- Kumasi Micro Credit users
(2, 'Kwame Nkrumah', 'kwame@kumasimicro.com', '$2b$12$hash5', '+233244555555', 'admin', NULL, 1),
(2, 'Ama Sarpong', 'ama@kumasimicro.com', '$2b$12$hash6', '+233244666666', 'clerk', NULL, 1),
(2, 'Kofi Mensah', 'kofi@kumasimicro.com', '$2b$12$hash7', '+233244777777', 'agent', 'KM001', 1),

-- Tamale Rural Bank users
(3, 'Abdul Rahman', 'abdul@tamalebank.com', '$2b$12$hash8', '+233244888888', 'admin', NULL, 1),
(3, 'Fatima Mohammed', 'fatima@tamalebank.com', '$2b$12$hash9', '+233244999999', 'agent', 'TB001', 1);

-- Insert sample customers
INSERT INTO customers (company_id, customer_number, first_name, last_name, phone, email, balance, created_by, status) VALUES
-- Accra Financial Services customers
(1, 'AFS001', 'Akosua', 'Boateng', '+233201123456', 'akosua@email.com', 1500.00, 3, 1),
(1, 'AFS002', 'Kwaku', 'Appiah', '+233201234567', 'kwaku@email.com', 2300.50, 3, 1),
(1, 'AFS003', 'Abena', 'Darko', '+233201345678', 'abena@email.com', 750.75, 4, 1),
(1, 'AFS004', 'Yaw', 'Addai', '+233201456789', 'yaw@email.com', 3200.00, 4, 1),
(1, 'AFS005', 'Esi', 'Kumah', '+233201567890', 'esi@email.com', 950.25, 3, 1),

-- Kumasi Micro Credit customers
(2, 'KMC001', 'Adjoa', 'Asiedu', '+233202123456', 'adjoa@email.com', 1200.00, 7, 1),
(2, 'KMC002', 'Nana', 'Owusu', '+233202234567', 'nana@email.com', 800.00, 7, 1),
(2, 'KMC003', 'Adwoa', 'Nyong', '+233202345678', 'adwoa@email.com', 1850.00, 7, 1),

-- Tamale Rural Bank customers
(3, 'TRB001', 'Alhassan', 'Ibrahim', '+233203123456', 'alhassan@email.com', 2100.00, 9, 1),
(3, 'TRB002', 'Zainab', 'Sulemana', '+233203234567', 'zainab@email.com', 1650.50, 9, 1);

-- Insert sample transactions
INSERT INTO transactions (company_id, customer_id, agent_id, transaction_type, amount, fee, commission, balance_before, balance_after, reference, description, status) VALUES
-- Accra Financial Services transactions
(1, 1, 3, 'credit', 500.00, 5.00, 10.00, 1000.00, 1500.00, 'TXN001', 'Cash deposit', 'successful'),
(1, 1, 3, 'debit', 200.00, 3.00, 6.00, 1500.00, 1300.00, 'TXN002', 'Cash withdrawal', 'successful'),
(1, 2, 3, 'credit', 1000.00, 10.00, 20.00, 1300.50, 2300.50, 'TXN003', 'Initial deposit', 'successful'),
(1, 3, 4, 'credit', 250.00, 2.50, 5.00, 500.75, 750.75, 'TXN004', 'Mobile money deposit', 'successful'),
(1, 4, 4, 'credit', 2000.00, 20.00, 40.00, 1200.00, 3200.00, 'TXN005', 'Bank transfer', 'successful'),
(1, 5, 3, 'credit', 450.00, 4.50, 9.00, 500.25, 950.25, 'TXN006', 'Cash deposit', 'successful'),

-- Kumasi Micro Credit transactions
(2, 6, 7, 'credit', 800.00, 8.00, 16.00, 400.00, 1200.00, 'TXN007', 'Loan disbursement', 'successful'),
(2, 7, 7, 'credit', 600.00, 6.00, 12.00, 200.00, 800.00, 'TXN008', 'Savings deposit', 'successful'),
(2, 8, 7, 'credit', 1350.00, 13.50, 27.00, 500.00, 1850.00, 'TXN009', 'Business deposit', 'successful'),

-- Tamale Rural Bank transactions
(3, 9, 9, 'credit', 1500.00, 15.00, 30.00, 600.00, 2100.00, 'TXN010', 'Salary deposit', 'successful'),
(3, 10, 9, 'credit', 1150.00, 11.50, 23.00, 500.50, 1650.50, 'TXN011', 'Remittance deposit', 'successful');

-- Add more recent transactions for testing
INSERT INTO transactions (company_id, customer_id, agent_id, transaction_type, amount, fee, commission, balance_before, balance_after, reference, description, status, created_at) VALUES
(1, 1, 3, 'debit', 100.00, 2.00, 4.00, 1300.00, 1200.00, 'TXN012', 'ATM withdrawal', 'successful', '2024-01-15 10:30:00'),
(1, 2, 4, 'credit', 500.00, 5.00, 10.00, 2300.50, 2800.50, 'TXN013', 'Cash deposit', 'successful', '2024-01-15 11:45:00'),
(2, 6, 7, 'debit', 300.00, 3.00, 6.00, 1200.00, 900.00, 'TXN014', 'Bill payment', 'successful', '2024-01-15 14:20:00'),
(3, 9, 9, 'debit', 200.00, 2.00, 4.00, 2100.00, 1900.00, 'TXN015', 'Transfer to bank', 'successful', '2024-01-15 16:10:00');

-- Update customer balances to match latest transactions
UPDATE customers SET balance = 1200.00 WHERE id = 1;
UPDATE customers SET balance = 2800.50 WHERE id = 2;
UPDATE customers SET balance = 900.00 WHERE id = 6;
UPDATE customers SET balance = 1900.00 WHERE id = 9;

-- Create some test data with edge cases
INSERT INTO companies (company_name, email, phone, address, status) VALUES
('Test Inactive Company', 'inactive@test.com', '+233244000000', 'Test Address', 0);

INSERT INTO users (company_id, name, email, password, phone, role, status) VALUES
(4, 'Inactive User', 'inactive@test.com', '$2b$12$testhash', '+233244000001', 'clerk', 0);

-- Add some failed transactions for testing error handling
INSERT INTO transactions (company_id, customer_id, agent_id, transaction_type, amount, fee, commission, balance_before, balance_after, reference, description, status) VALUES
(1, 1, 3, 'debit', 5000.00, 50.00, 100.00, 1200.00, 1200.00, 'TXN016', 'Failed withdrawal - insufficient funds', 'failed'),
(2, 6, 7, 'credit', 1000.00, 10.00, 20.00, 900.00, 900.00, 'TXN017', 'Failed deposit - system error', 'error');

COMMIT;