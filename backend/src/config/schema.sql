-- Enable UUID generation extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Institutions Table
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    is_verified BOOLEAN DEFAULT FALSE,
    otp_code VARCHAR(6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    otp_code VARCHAR(6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
    cert_id VARCHAR(66) PRIMARY KEY, -- bytes32 representation (0x...)
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    student_name VARCHAR(255) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    grade VARCHAR(50) NOT NULL,
    cert_hash VARCHAR(66) UNIQUE NOT NULL, -- SHA-256 hash of PDF
    ipfs_cid VARCHAR(100) NOT NULL,
    tx_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'issued', -- 'issued', 'revoked'
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for Verification & Lookup Performance
CREATE INDEX IF NOT EXISTS idx_certificates_hash ON certificates(cert_hash);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_institution ON certificates(institution_id);

-- Certificate Requests Table (Student Applications)
CREATE TABLE IF NOT EXISTS certificate_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    roll_number VARCHAR(100) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    grade VARCHAR(50) DEFAULT 'A',
    student_photo VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending_college', -- 'pending_college', 'approved_by_college', 'rejected_by_college', 'approved_by_admin', 'rejected_by_admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255),
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 2. Revoked Certificates Table
CREATE TABLE IF NOT EXISTS revoked_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cert_id VARCHAR(66) UNIQUE REFERENCES certificates(cert_id) ON DELETE CASCADE,
    revoked_by VARCHAR(255),
    reason TEXT NOT NULL,
    tx_hash VARCHAR(66),
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Certificate Versions Table
CREATE TABLE IF NOT EXISTS certificate_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cert_id VARCHAR(66) NOT NULL,
    version_number INT NOT NULL DEFAULT 1,
    modified_by VARCHAR(255),
    reason TEXT NOT NULL,
    prev_hash VARCHAR(66),
    new_hash VARCHAR(66) NOT NULL,
    ipfs_cid VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cert_versions_cert_id ON certificate_versions(cert_id);

-- 4. Blockchain Transactions Table
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT,
    wallet_address VARCHAR(42) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    gas_used VARCHAR(50),
    status VARCHAR(20) DEFAULT 'SUCCESS',
    cert_id VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tx_hash ON blockchain_transactions(tx_hash);

-- 6. Bulk Upload Batches Table
CREATE TABLE IF NOT EXISTS bulk_upload_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    total_records INT NOT NULL,
    processed_records INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'processing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'SENT',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. OTP Requests Table
CREATE TABLE IF NOT EXISTS otp_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_requests(email);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- 10. Verification Logs Table
CREATE TABLE IF NOT EXISTS verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cert_id VARCHAR(66),
    verification_result VARCHAR(50) NOT NULL,
    ip_address VARCHAR(100),
    browser VARCHAR(255),
    device VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_verif_logs_cert ON verification_logs(cert_id);

-- 11. Post-Quantum Cryptography Institution Keypair Table (NIST ML-DSA-65)
CREATE TABLE IF NOT EXISTS institution_pqc_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID UNIQUE REFERENCES institutions(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    algorithm VARCHAR(50) DEFAULT 'ML-DSA-65',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Post-Quantum Signatures Table (NIST ML-DSA-65)
CREATE TABLE IF NOT EXISTS pqc_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cert_id VARCHAR(66) UNIQUE REFERENCES certificates(cert_id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    signature TEXT NOT NULL,
    public_key TEXT NOT NULL,
    algorithm VARCHAR(50) DEFAULT 'ML-DSA-65',
    signed_hash VARCHAR(66) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pqc_sig_cert ON pqc_signatures(cert_id);


