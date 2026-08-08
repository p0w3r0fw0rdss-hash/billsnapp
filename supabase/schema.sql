-- ============================================
-- BillSnap - Supabase Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'accountant', 'user', 'viewer')),
    avatar_url TEXT,
    language VARCHAR(10) DEFAULT 'es',
    theme VARCHAR(20) DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- ============================================
-- COMPANIES TABLE
-- ============================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'España',
    email VARCHAR(255),
    phone VARCHAR(50),
    logo_url TEXT,
    iban VARCHAR(50),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'España',
    email VARCHAR(255),
    phone VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INVOICES TABLE (Received)
-- ============================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Invoice details
    invoice_number VARCHAR(100),
    date DATE NOT NULL,
    due_date DATE,
    
    -- Issuer (who sent the invoice)
    issuer_name VARCHAR(255),
    issuer_tax_id VARCHAR(50),
    issuer_address TEXT,
    issuer_email VARCHAR(255),
    
    -- Receiver (us)
    receiver_name VARCHAR(255),
    receiver_tax_id VARCHAR(50),
    receiver_address TEXT,
    
    -- Description
    description TEXT,
    
    -- Amounts
    base_amount DECIMAL(12,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 21,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    withholding_rate DECIMAL(5,2) DEFAULT 0,
    withholding_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'EUR',
    
    -- Classification
    type VARCHAR(20) DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'pending', 'paid', 'overdue', 'cancelled')),
    
    -- Payment
    payment_method VARCHAR(100),
    iban VARCHAR(50),
    
    -- Source
    source_file VARCHAR(255),
    source_type VARCHAR(50) CHECK (source_type IN ('photo', 'pdf', 'docx', 'xlsx', 'manual', 'api')),
    ocr_engine VARCHAR(50),
    ocr_confidence DECIMAL(5,4),
    raw_text TEXT,
    
    -- Metadata
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- EMITTED INVOICES TABLE (Our invoices)
-- ============================================
CREATE TABLE emitted_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Invoice details
    invoice_number VARCHAR(100) NOT NULL,
    series VARCHAR(20) DEFAULT 'A',
    date DATE NOT NULL,
    due_date DATE,
    
    -- Client (receiver)
    client_name VARCHAR(255),
    client_tax_id VARCHAR(50),
    client_address TEXT,
    client_email VARCHAR(255),
    
    -- Description
    description TEXT,
    
    -- Line items
    items JSONB DEFAULT '[]',
    
    -- Amounts
    base_amount DECIMAL(12,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 21,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    withholding_rate DECIMAL(5,2) DEFAULT 0,
    withholding_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'EUR',
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'sent', 'paid', 'overdue', 'cancelled')),
    
    -- Verifactu
    verifactu_hash VARCHAR(255),
    verifactu_qr TEXT,
    verifactu_xml TEXT,
    verifactu_status VARCHAR(20) CHECK (verifactu_status IN ('pending', 'submitted', 'accepted', 'rejected')),
    verifactu_date TIMESTAMP WITH TIME ZONE,
    
    -- PDF
    pdf_url TEXT,
    
    -- Payment
    payment_method VARCHAR(100),
    payment_date DATE,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    icon VARCHAR(10),
    type VARCHAR(20) CHECK (type IN ('income', 'expense')),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    invoices_limit INTEGER,
    invoices_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CREDITS TABLE (for local version)
-- ============================================
CREATE TABLE credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    used INTEGER DEFAULT 0,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stripe_payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, key)
);

-- ============================================
-- EVENTS LOG TABLE (for Verifactu)
-- ============================================
CREATE TABLE event_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invoice_id UUID,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_date ON invoices(date);
CREATE INDEX idx_invoices_type ON invoices(type);
CREATE INDEX idx_invoices_status ON invoices(status);

CREATE INDEX idx_emitted_company ON emitted_invoices(company_id);
CREATE INDEX idx_emitted_client ON emitted_invoices(client_id);
CREATE INDEX idx_emitted_date ON emitted_invoices(date);
CREATE INDEX idx_emitted_status ON emitted_invoices(status);

CREATE INDEX idx_clients_company ON clients(company_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_credits_user ON credits(user_id);
CREATE INDEX idx_settings_user ON settings(user_id);
CREATE INDEX idx_event_log_user ON event_log(user_id);
CREATE INDEX idx_event_log_invoice ON event_log(invoice_id);

-- ============================================
-- DEFAULT CATEGORIES
-- ============================================
INSERT INTO categories (id, name, name_en, icon, type, is_default) VALUES
(uuid_generate_v4(), 'Luz', 'Electricity', '⚡', 'expense', true),
(uuid_generate_v4(), 'Teléfono/Internet', 'Phone/Internet', '📱', 'expense', true),
(uuid_generate_v4(), 'Alquiler', 'Rent', '🏢', 'expense', true),
(uuid_generate_v4(), 'Material', 'Materials', '📦', 'expense', true),
(uuid_generate_v4(), 'Servicios', 'Services', '👔', 'expense', true),
(uuid_generate_v4(), 'Transporte', 'Transport', '🚗', 'expense', true),
(uuid_generate_v4(), 'Seguros', 'Insurance', '🛡️', 'expense', true),
(uuid_generate_v4(), 'Software', 'Software', '💻', 'expense', true),
(uuid_generate_v4(), 'Hosting', 'Hosting', '🌐', 'expense', true),
(uuid_generate_v4(), 'Marketing', 'Marketing', '📢', 'expense', true),
(uuid_generate_v4(), 'Formación', 'Training', '📚', 'expense', true),
(uuid_generate_v4(), 'Comidas', 'Meals', '🍽️', 'expense', true),
(uuid_generate_v4(), 'Otros gastos', 'Other expenses', '📋', 'expense', true),
(uuid_generate_v4(), 'Ventas', 'Sales', '💰', 'income', true),
(uuid_generate_v4(), 'Servicios prestados', 'Services provided', '🔧', 'income', true),
(uuid_generate_v4(), 'Consultoría', 'Consulting', '💡', 'income', true),
(uuid_generate_v4(), 'Comisiones', 'Commissions', '📈', 'income', true),
(uuid_generate_v4(), 'Alquileres', 'Rent collected', '🏠', 'income', true),
(uuid_generate_v4(), 'Otros ingresos', 'Other income', '📋', 'income', true);
