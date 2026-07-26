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

-- Seed Default Real Approved Colleges (JNTUGV & Affiliated Institutes)
INSERT INTO institutions (name, wallet_address, email, password_hash, status, is_verified)
VALUES 
  ('JNTUGV University College of Engineering Vizianagaram', '0x5b38da6a701c568545dcfcb03fcb875f56beddc4', 'jntugv_main@domain.com', '$2a$10$jmYTXon7Rluvj5ba.262seAYoB5oP7O7A0kgHgGI801f8Q6ZKFUaq', 'approved', true),
  ('MVGR College of Engineering (Autonomous)', '0xd0e2367b49cd8536C47b7CE7C475FdE5Dd89DEA0', 'mvgr@domain.com', '$2a$10$jmYTXon7Rluvj5ba.262seAYoB5oP7O7A0kgHgGI801f8Q6ZKFUaq', 'approved', true),
  ('GMR Institute of Technology (GMRIT)', '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', 'gmrit@domain.com', '$2a$10$jmYTXon7Rluvj5ba.262seAYoB5oP7O7A0kgHgGI801f8Q6ZKFUaq', 'approved', true),
  ('Lendi Institute of Engineering & Technology', '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', 'lendi@domain.com', '$2a$10$jmYTXon7Rluvj5ba.262seAYoB5oP7O7A0kgHgGI801f8Q6ZKFUaq', 'approved', true)
ON CONFLICT (email) DO NOTHING;
