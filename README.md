# 🎓 CertiShield | Blockchain & Post-Quantum Academic Certificate Verification System

[![Post-Quantum Cryptography](https://img.shields.io/badge/Post--Quantum-NIST_FIPS_204_(ML--DSA--65)-purple.svg)](https://csrc.nist.gov/pubs/fips/204/final)
[![Blockchain](https://img.shields.io/badge/Blockchain-Ethereum_/_Polygon_Amoy-blue.svg)](https://polygon.technology)
[![Storage](https://img.shields.io/badge/Storage-IPFS_(Pinata)-cyan.svg)](https://pinata.cloud)
[![Database](https://img.shields.io/badge/Database-PostgreSQL_(Supabase)-emerald.svg)](https://supabase.com)
[![Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()

**CertiShield** is an enterprise-grade, decentralized credential management and verification platform engineered for **JNTUGV (Jawaharlal Nehru Technological University Gurajada Vizianagaram)** and its affiliated associate colleges (e.g., MVGR, GMRIT, Lendi).

The system features a **Quantum-Resistant Hybrid Security Architecture**, combining **Ethereum / Polygon Blockchain Smart Contracts** with **NIST FIPS 204 ML-DSA-65 (CRYSTALS-Dilithium)** digital signatures, **IPFS** decentralized storage, and a **Live Web Camera & Image QR Code Scanner**.

---

## 🏛️ System Architecture Overview

```mermaid
graph TD
    A["🎓 Student Application"] --> B["🏢 College Review & Approval"]
    B --> C["🏛️ JNTUGV Admin Final Approval"]
    C --> D["⚡ SHA-256 PDF & QR Code Generation"]
    D --> E["🛡️ NIST ML-DSA-65 Signature Generation"]
    E --> F["⛓️ Blockchain Smart Contract Anchoring"]
    F --> G["🌐 IPFS Decentralized Pinning"]
    G --> H["✅ Public & Live Camera QR Code Verification"]
```

---

## 🌟 Key Enterprise Features

### 🛡️ 1. Post-Quantum Cryptography Layer (NIST FIPS 204 ML-DSA)
- **NIST ML-DSA-65 (Dilithium3) Standard**: Every issuing college holds a unique post-quantum keypair.
- **SHA-256 Hash Signing**: Certificate PDF hashes are signed using ML-DSA private keys to withstand quantum computing attacks (Shor's Algorithm).
- **Dual Verification Requirement**: Public verifications check BOTH:
  - ✓ Blockchain smart contract SHA-256 hash match.
  - ✓ NIST ML-DSA signature validity.

### 📱 2. Live Web Camera & Image QR Code Scanner
- **Live Camera Scanner**: Point smartphone or webcam at physical or digital certificates to verify instantly.
- **Upload QR Image**: Upload certificate QR code screenshots or photos to decode Certificate ID and verify on-chain.
- **Dynamic Live Domain QR Generation**: Generated QR codes automatically adapt to your live domain (`https://certificate-verification-frontend-639g.onrender.com/verify-by-id?id=...`).

### 🔑 3. Authentication & UX Security Enhancements
- **Interactive Password Visibility Toggle**: Eye & EyeOff icon toggles across all Login, Reset Password, and Signup forms.
- **Passwordless OTP Sign-In**: 6-digit email OTP login mode with automatic session token persistence and role-based portal routing.
- **Resilient IPv4 Database Query Engine**: Fault-tolerant PostgreSQL connection pool with fallback query handlers preventing HTTP 500 status crashes on Render.

### 📊 4. Core Credential Governance & 14 Enterprise Extended Modules
1. **Decentralized Certificate Registry (`CertificateRegistry.sol`)**: On-chain smart contract recording certificate IDs, SHA-256 hashes, IPFS CIDs, and issuer authorization.
2. **Dynamic PDF Generator**: Generates formal e-certificates with embedded student photos, university logos, SHA-256 hashes, and **`SCAN TO VERIFY` QR Codes**.
3. **Security Audit Log Explorer (`/admin/audit-logs`)**: Complete compliance tracking of logins, issuances, verifications, revocations, and IP metadata.
4. **On-Chain & Database Revocation Engine**: Instantly revokes invalid or compromised credentials with reason logging.
5. **Certificate Version History**: Tracks re-issuances, preserving version numbers, modified dates, change reasons, and hash diffs.
6. **Admin Analytics Dashboard (`/admin/analytics`)**: Executive charts for total issuances, verification requests, revocation rates, and monthly trends.
7. **Bulk Certificate CSV Upload (`/institution/bulk-upload`)**: Batch CSV file processor for issuing certificates to graduating classes in bulk.
8. **Automated Email Notification Engine**: Dispatches HTML emails for certificate issuance and updates, logged in `email_logs`.
9. **Passwordless OTP Login**: Optional 6-digit email OTP authentication alongside standard password login.
10. **In-App Notification Center**: Real-time navbar dropdown with unread notification counts.
11. **Public Verification Attempt Logs (`/admin/verification-logs`)**: Tracks IP addresses, user agents, device platforms, and lookup outcomes.
12. **Enhanced QR Metadata Inspector**: Interactive view rendering candidate details, on-chain hash, IPFS link, and live blockchain status.
13. **Multi-Format Export Reports**: Exports CSV/Excel and PDF reports for Issued Certificates, Revoked Logs, and Audit Logs.
14. **Certificate Activity Lifecycle Timeline (`/timeline/:certId`)**: Step-by-step visual tracker (`Application` $\rightarrow$ `College Approval` $\rightarrow$ `Admin Anchoring` $\rightarrow$ `ML-DSA Signature` $\rightarrow$ `Blockchain State`).

---

## 💻 Tech Stack

* **Post-Quantum Cryptography:** `@noble/post-quantum/ml-dsa` (NIST FIPS 204 ML-DSA-65)
* **Blockchain Ledger:** Ethereum Sepolia / Polygon Amoy Testnet (Solidity 0.8.20, Hardhat, Ethers.js v6)
* **Decentralized Storage:** IPFS (via Pinata Gateway)
* **Relational Database:** PostgreSQL (via Supabase Cloud)
* **Backend REST API:** Node.js, Express.js, Ethers.js, PDFKit, QRCode, jsQR, Nodemailer, bcryptjs, JWT
* **Frontend SPA Client:** React 18, Vite, Tailwind CSS v3, Lucide Icons, Canvas-Confetti
* **CI/CD Pipeline:** GitHub Actions (`.github/workflows/build-test.yml`), Render Infrastructure Blueprint (`render.yaml`)

---

## 🗄️ Database Schema (15 Relational Tables)

- `institutions` - Approved university & college accounts & wallet addresses
- `students` - Student registration & credential profiles
- `certificates` - Issued certificate metadata & cryptographic hashes
- `certificate_requests` - Student application lifecycle state
- `institution_pqc_keys` - NIST ML-DSA-65 keypair registry per institution
- `pqc_signatures` - ML-DSA signatures, public keys, and signed hash metadata
- `audit_logs` - Security event audit trails
- `revoked_certificates` - Revocation reasons & on-chain revocation logs
- `certificate_versions` - Version diffs for modified certificates
- `blockchain_transactions` - Mined transaction hashes & gas metrics
- `bulk_upload_batches` - Batch upload file tracking & progress
- `email_logs` - Notification email dispatch status
- `otp_requests` - Passwordless OTP codes & expiration timestamps
- `notifications` - In-app notifications & unread state
- `verification_logs` - Public lookup attempt logs (IP & device metadata)

---

## 🗺️ API Endpoints Map

### Public & Verification Routes
- `POST /v1/verify/upload` - Verify certificate by PDF drag-and-drop
- `GET /v1/verify/:certId` - Verify certificate by ID & check ML-DSA signature
- `POST /v1/pqc/verify` - Standalone NIST ML-DSA signature verification
- `GET /v1/pqc/keys/:institutionId` - Get institution's public ML-DSA key

### Auth & User Portals
- `POST /v1/auth/login` - Authenticate user session
- `POST /v1/auth/register-student` - Student registration
- `POST /v1/auth/register-institution` - Institution registration
- `POST /v1/otp-auth/request-otp` - Dispatch 6-digit login OTP
- `POST /v1/otp-auth/verify-otp` - Verify login OTP code

### Admin & Institution Routes
- `GET /v1/admin/certificates/issued` - Fetch all issued certificates sorted by date
- `POST /v1/admin/institutions/:id/approve` - Authorize institution wallet on-chain
- `POST /v1/admin/applications/:id/approve` - Issue e-certificate & anchor on blockchain
- `POST /v1/institutions/certificates/:certId/revoke` - Revoke certificate on-chain
- `POST /v1/bulk/process-batch` - Process bulk CSV batch certificate issuance

---

## ⚡ Quickstart Guide

### 1. Install Dependencies
```powershell
npm install --prefix contracts
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure Environment Variables (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_jwt_token_for_certificate_system_2026

# Database Connection (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@db.your-supabase-project.supabase.co:6543/postgres

# Blockchain & IPFS Configuration
ALCHEMY_AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/your-api-key
CONTRACT_ADDRESS=0xF32af42ADFe9701996f86480C9700960502FecE4
ADMIN_PRIVATE_KEY=your_wallet_private_key
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_API_KEY=your_pinata_secret

# Live Domain Configuration for QR Codes
APP_BASE_URL=https://certificate-verification-frontend-639g.onrender.com
FRONTEND_URL=https://certificate-verification-frontend-639g.onrender.com
```

### 3. Launch Development Servers
```powershell
# Terminal 1 (Backend API):
npm run dev:backend

# Terminal 2 (Frontend React Client):
npm run start:frontend
```
Access the client web app at `http://localhost:3000`.

---

## 🌐 Live Production Deployment

- **Live Frontend Web App**: `https://certificate-verification-frontend-639g.onrender.com`
- **GitHub Repository**: `https://github.com/Amulyamamidi/Ecertificatedemoproject.git`
