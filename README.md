# CertiShield | Blockchain Academic Certificate Verification System
### MCA Final Year Capstone Project (Zero-Cost Enterprise Implementation)

CertiShield is a decentralized academic certificate issuance, governance, and verification system built for **JNTUGV (Jawaharlal Nehru Technological University Gurajada Vizianagaram)** and its affiliated associate colleges (e.g., MVGR, GMRIT, Lendi). By utilizing **Ethereum Sepolia / Polygon Amoy Testnets** for ledger state registry, **IPFS (via Pinata)** for decentralized file pinning, and **PostgreSQL (via Supabase)** for off-chain relational metadata index lookups, this project runs on a **$0 / free-tier stack** suitable for college evaluations, academic presentations, and real-world production deployment.

---

## 1. Key System Features

### Core Credential Governance
* **Decentralized Certificate Registry:** Smart contract (`CertificateRegistry.sol`) deployed on-chain to record certificate IDs, SHA-256 hashes, IPFS CIDs, and issuer state.
* **E-Certificate PDF Generation:** Dynamic PDF generator with embedded **Verification QR Codes**, student photographs, university logos, and SHA-256 cryptographic document hashes.
* **Multi-Role Portals:**
  * **System Admin (JNTUGV):** Approve/Whitelist institution wallet addresses, issue approved certificates, inspect audit logs, and analyze university-wide metrics.
  * **Institutions (Colleges):** Approve student applications, issue certificates, process bulk uploads, and revoke credentials on-chain.
  * **Students:** Upload photos, select JNTUGV constituent/associate colleges, verify email via OTP, apply for E-Certificates, and download verified PDFs.
  * **Public Verifier:** Drag-and-drop PDF verifier with instantaneous cryptographic hash matching and tamper detection.

### 🌟 13 Enterprise Extended Modules

1. **Security Audit Log Module (`/admin/audit-logs`):** Full system compliance audit tracking admin/student logins, certificate creation, verification, revocation, and downloads with IP address tracking.
2. **On-Chain & Off-Chain Certificate Revocation:** Enables institutions/admins to revoke invalid certificates with a recorded reason, displaying prominent REVOKED badges across public verification portals.
3. **Certificate Version History:** Maintains complete historical records for credential re-issuances, preserving version numbers, modified dates, change reasons, and hash diffs.
4. **Admin Analytics Dashboard (`/admin/analytics`):** Executive overview charts for Total Issuances, Verification Requests, Revocation Counts, Monthly Trends, and Security Event Streams.
5. **Bulk Certificate Upload (`/institution/bulk-upload`):** Batch CSV file processor for issuing certificates for entire graduating classes, pinning PDFs to IPFS, and registering hashes on-chain in bulk. Includes sample CSV template download.
6. **Email Notification Module:** Automated HTML email delivery for certificate issuance, revocation, and updates, backed by an `email_logs` status registry.
7. **Passwordless OTP Authentication:** Optional 6-digit email OTP login mode alongside traditional password login.
8. **In-App Notification Center:** Real-time dropdown bell in the navigation bar with unread counts and mark-as-read toggles.
9. **Public Verification Attempt Logs (`/admin/verification-logs`):** Tracks IP addresses, user agents, device platforms, and outcome results for all credential lookup checks.
10. **Enhanced QR Verification:** Interactive metadata screen rendering candidate details, on-chain hash, IPFS gateway link, and live blockchain status upon scanning.
11. **Advanced Search Filters:** Search bar component filtering records by Student Name, Certificate ID, Roll Number, Department, Status, and Date ranges.
12. **Multi-Format Export Reports:** Downloads Excel/CSV and PDF reports for Issued Certificates, Revoked Logs, Verification Logs, and Audit Logs.
13. **Certificate Activity Lifecycle Timeline (`/timeline/:certId`):** Visual step-by-step timeline tracking Certificate Created $\rightarrow$ Blockchain Hash Stored $\rightarrow$ IPFS Pinned $\rightarrow$ Public Verifications $\rightarrow$ Revocation.

---

## 2. Project Tech Stack

* **Blockchain Ledger:** Ethereum Sepolia / Polygon Amoy Testnet (Solidity 0.8.20, Hardhat, Ethers.js v6)
* **Decentralized Storage:** IPFS (via Pinata API)
* **Off-chain Relational Database:** PostgreSQL (via Supabase Cloud)
* **Backend REST API:** Node.js, Express.js, Ethers.js, PDFKit, QRCode, Nodemailer, EmailJS, bcryptjs, JWT
* **Frontend SPA Client:** React, Tailwind CSS v3, Lucide Icons, canvas-confetti, Vite
* **Auth Protocol:** JSON Web Tokens (JWT) + bcrypt password hashing + SMTP/EmailJS 6-Digit OTP Verification

---

## 3. Database Schema Architecture

The relational PostgreSQL database uses 13 isolated tables:
* `institutions` - Approved university & college accounts & wallets
* `students` - Student registration & credential profiles
* `certificates` - Issued certificate metadata & cryptographic hashes
* `certificate_requests` - Student application lifecycle state
* `audit_logs` - Compliance & security event logs
* `revoked_certificates` - Revocation reasons & on-chain revocation records
* `certificate_versions` - Historical version diffs for modified certificates
* `blockchain_transactions` - Mined transaction hashes & gas metrics
* `bulk_upload_batches` - Batch upload file tracking & progress
* `email_logs` - Notification email dispatch status
* `otp_requests` - Passwordless OTP codes & expiration timestamps
* `notifications` - User in-app notifications & unread state
* `verification_logs` - Public lookup attempt logs (IP & device metadata)

---

## 4. API Endpoints Map

### Core Routes
* `POST /v1/auth/login` - Authenticate user session
* `POST /v1/auth/register-student` - Student registration
* `POST /v1/auth/register-institution` - Institution registration
* `POST /v1/verify/upload` - Verify certificate by PDF drag-and-drop
* `GET /v1/verify/:certId` - Verify certificate by ID

### Extended Feature Routes
* `GET /api/audit-logs` - Query security audit logs
* `POST /api/revocation/revoke` - Revoke certificate with reason
* `GET /api/versions/:certId` - Retrieve certificate version history
* `GET /api/transactions` - Fetch blockchain transaction explorer list
* `GET /api/analytics/summary` - Aggregated administrative metrics
* `POST /api/bulk/process-batch` - Bulk CSV batch certificate issuance
* `GET /api/bulk/template` - Download sample CSV template
* `POST /api/otp-auth/request-otp` - Dispatch 6-digit login OTP
* `POST /api/otp-auth/verify-otp` - Verify login OTP code
* `GET /api/notifications` - Fetch user in-app notifications
* `GET /api/verification-logs` - Query public verification attempts
* `GET /api/reports/export` - Export CSV/PDF reports
* `GET /api/timeline/:certId` - Fetch certificate lifecycle events

---

## 5. Directory Structure

```text
blockchain/
├── backend/                  # Node.js + Express API Server
│   ├── src/
│   │   ├── config/           # DB Pool (pg), SQL schema, contract details
│   │   ├── middleware/       # JWT auth guards (requireAdmin, requireInstitution)
│   │   ├── routes/           # 18 REST endpoints (Auth, Admin, Institution, Student, Verify, Audit, Revocation, etc.)
│   │   ├── services/         # IPFS (Pinata), Blockchain (Ethers), PDFGen, Hash, Email, Audit, Export
│   │   └── index.js          # Express API Server entrypoint
│   └── package.json
├── contracts/                # Hardhat Solidity Smart Contracts
│   ├── contracts/
│   │   └── CertificateRegistry.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── hardhat.config.js
│   └── package.json
├── frontend/                 # React SPA Client (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/       # Modals (Revoke, Version, OTP, QR, Export), Navbar, SearchFilters, Timeline
│   │   ├── context/          # AuthContext Session State
│   │   ├── pages/            # Verify, Login, Register, Dashboards, Employer, Analytics, AuditLogs, Transactions, BulkUpload
│   │   └── App.jsx           # App Router
│   ├── package.json
│   └── vite.config.js
└── package.json              # Workspace script runner
```

---

## 6. Quickstart Guide

### Step 1: Install Dependencies
```powershell
npm install --prefix contracts
npm install --prefix backend
npm install --prefix frontend
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` inside `/backend`:
```env
PORT=5000
JWT_SECRET=super_secret_jwt_token_for_certificate_system_2026

# Database Configuration (PostgreSQL / Supabase)
DATABASE_URL=postgresql://postgres:password@db.your-supabase-project.supabase.co:5432/postgres

# Blockchain RPC & Smart Contract Details
ALCHEMY_AMOY_RPC_URL=https://ethereum-sepolia.publicnode.com
CONTRACT_ADDRESS=0xF32af42ADFe9701996f86480C9700960502FecE4
ADMIN_PRIVATE_KEY=your_private_key
```

### Step 3: Run Services Concurrently
```powershell
# Terminal 1 (Backend API):
npm run dev:backend

# Terminal 2 (Frontend Client):
npm run start:frontend
```
Access client UI at `http://localhost:3000`.

---

## 7. Demo Guide for Evaluators

1. **Tamper Detection Test:** Drag & drop an authentic PDF on the **Verify** page $\rightarrow$ Green Shield Verified. Modify one character in the PDF text $\rightarrow$ Red Shield Tamper Warning.
2. **Revocation Flow:** Log in as Institution $\rightarrow$ Click Revoke on a certificate $\rightarrow$ Provide reason. Verify again $\rightarrow$ Red REVOKED badge displayed with reason.
3. **Employer Portal:** Visit `/employer` $\rightarrow$ Enter Certificate ID $\rightarrow$ Click **Download Official Employer Report PDF**.
4. **Lifecycle Timeline:** Visit `/timeline/:certId` $\rightarrow$ View complete step-by-step history.
5. **Bulk Upload:** Go to `/institution/bulk-upload` $\rightarrow$ Download template CSV $\rightarrow$ Upload CSV $\rightarrow$ Batch process 5+ certificates automatically.
