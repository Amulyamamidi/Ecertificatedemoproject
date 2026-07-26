-- PostgreSQL Schema for CertiShield JNTUGV Blockchain Certificate Verification Portal

CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  wallet_address VARCHAR(128),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  is_verified BOOLEAN DEFAULT FALSE,
  otp_code VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  otp_code VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_id VARCHAR(100) UNIQUE NOT NULL,
  institution_id UUID REFERENCES institutions(id),
  student_id UUID REFERENCES students(id),
  student_name VARCHAR(255),
  course_name VARCHAR(255),
  grade VARCHAR(50),
  cert_hash VARCHAR(255),
  ipfs_cid VARCHAR(255),
  tx_hash VARCHAR(255),
  status VARCHAR(50) DEFAULT 'issued',
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certificate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  institution_id UUID REFERENCES institutions(id),
  roll_number VARCHAR(100),
  course_name VARCHAR(255),
  grade VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending_college',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
