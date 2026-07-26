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

