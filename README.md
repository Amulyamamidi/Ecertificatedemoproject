# CertiShield | Blockchain Academic Certificate Verification System
### MCA Final Year Capstone Project (Zero-Cost Production Implementation)

CertiShield is a decentralized academic certificate issuance and verification system built for **JNTUGV (Jawaharlal Nehru Technological University Gurajada Vizianagaram)** and its affiliated associate colleges. By utilizing **Ethereum Sepolia / Polygon Amoy Testnets** for ledger state registry, **IPFS (via Pinata)** for decentralized file pinning, and **PostgreSQL (via Supabase)** for off-chain relational metadata index lookups, this project runs on a **$0 / free-tier stack** suitable for college evaluations, academic presentations, and real-world deployment.

---

## 1. Key System Features

* **Decentralized Certificate Registry:** Smart contract (`CertificateRegistry.sol`) deployed on-chain to record certificate IDs, SHA-256 hashes, and IPFS CIDs.
* **E-Certificate PDF Generation:** Dynamic PDF generator with embedded **Verification QR Codes**, student photographs, university logos, and SHA-256 cryptographic document hashes.
* **JNTUGV & Affiliated Associate College Support:** Custom branding for JNTUGV Constituent & Associate Colleges (e.g., MVGR, GMRIT, Lendi).
* **Multi-Role Portals:**
  * **System Admin (JNTUGV):** Approve/Whitelist institution wallet addresses, issue approved certificates, remove/delete institutions.
  * **Institutions (Colleges):** Approve student applications, issue certificates, and revoke credentials on-chain.
  * **Students:** Upload photos, select JNTUGV constituent/associate colleges, apply for E-Certificates, and download verified PDFs.
  * **Public Verifier:** Drag-and-drop PDF verifier with instantaneous cryptographic hash matching and tamper detection.

---

## 2. Project Tech Stack

* **Blockchain Ledger:** Ethereum Sepolia / Polygon Amoy Testnet (Solidity 0.8.20, Hardhat, Ethers.js v6)
* **Decentralized Storage:** IPFS (via Pinata API)
* **Off-chain Relational Index:** PostgreSQL (via Supabase Cloud)
* **Backend REST API:** Node.js, Express.js, Ethers.js, PDFKit, QRCode, bcryptjs, JWT
* **Frontend SPA Client:** React, Tailwind CSS v3, Lucide Icons, canvas-confetti
* **Auth Protocol:** JSON Web Tokens (JWT) + bcrypt password hashing

---

## 3. Project Directory Structure

```text
blockchain/
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── config/           # DB Pool, Supabase schema, contract details
│   │   ├── controllers/      # Route controllers (Auth, Institution, Student, Verify)
│   │   ├── middleware/       # JWT and authorization guards
│   │   ├── routes/           # REST endpoints mapping (Admin, Student, Institution, Verify)
│   │   ├── services/         # IPFS (Pinata), Blockchain (Ethers), PDFGen (PDFKit + QRCode), Hash (SHA-256)
│   │   └── index.js          # API server entrypoint
│   └── package.json
├── contracts/                # Hardhat Solidity Smart Contracts
│   ├── contracts/
│   │   └── CertificateRegistry.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   │   └── CertificateRegistry.test.js
│   ├── hardhat.config.js
│   └── package.json
├── frontend/                 # React SPA client
│   ├── src/
│   │   ├── components/       # Layouts, Navbar, ProtectedRoute
│   │   ├── context/          # Session AuthContext
│   │   ├── pages/            # Public Verify, Logins, Portals, Dashboards
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── package.json              # Root workspace manager
```

---

## 4. Quickstart: Offline Mock Mode (Recommended for Instant Demos)

To run the application immediately without signing up for external testnet faucets or cloud services, a built-in **Offline Mock Mode** is active by default.

### Step 1: Install Dependencies
Open your shell at the project root directory and run:
```powershell
# Install contracts dependencies
npm install --prefix contracts

# Install backend dependencies
npm install --prefix backend

# Install frontend dependencies
npm install --prefix frontend
```

### Step 2: Seed Mock Data
Pre-populate the local database and blockchain simulator with JNTUGV constituent & associate college profiles:
```powershell
npm run seed --prefix backend
```

### Step 3: Run the Services
Open two terminal tabs to run the backend API and frontend client concurrently:

* **Terminal 1 (Backend):**
  ```powershell
  npm run dev:backend
  ```
* **Terminal 2 (Frontend):**
  ```powershell
  npm run start:frontend
  ```

Once running, access the web client at: `http://localhost:3000`

---

## 5. Seeding & Login Credentials (Mock Mode)

Use the following pre-registered credentials to demonstrate the different portal views:

* **System Administrator (JNTUGV Admin):**
  * **Email:** `admin@system.com`
  * **Password:** `admin123`
* **JNTUGV Main Campus:**
  * **Email:** `jntugv_main@domain.com`
  * **Password:** `oxford123`
* **MVGR College of Engineering (Affiliated Associate College):**
  * **Email:** `mvgr@domain.com`
  * **Password:** `oxford123`
* **GMR Institute of Technology (Affiliated Associate College):**
  * **Email:** `gmrit@domain.com`
  * **Password:** `oxford123`
* **Pending Institution (Pending State University):**
  * **Email:** `pending_uni@domain.com`
  * **Password:** `pending123` *(Requires admin approval before logging in)*
* **Student (Saiku Kumar):**
  * **Email:** `saiku@domain.com`
  * **Password:** `student123`

---

## 6. Deploying to Live Testnet (Ethereum Sepolia / Polygon Amoy)

To connect the application to the live blockchain testnet, Supabase cloud database, and Pinata IPFS gateway:

1. **Claim Free Sepolia ETH:** Visit the [Google Cloud Web3 Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) and claim 0.05 Sepolia ETH to your admin wallet (`0xE652eDde655aed8cCF6699Cdd338d0055F160DC9`).
2. **Deploy Smart Contract:**
   ```powershell
   cd contracts
   npx hardhat run scripts/deploy.js --network sepolia
   ```
3. **Configure Backend `.env`:**
   Open `/backend/.env` and update:
   ```env
   USE_MOCK_SERVICES=false
   ALCHEMY_AMOY_RPC_URL=https://ethereum-sepolia.publicnode.com
   CONTRACT_ADDRESS=0xYourDeployedContractAddress
   ADMIN_PRIVATE_KEY=your_private_key
   ```
4. **Restart Backend:** Restart `npm run dev` in `/backend`.

---

## 7. How to Demonstrate to Evaluators (Demo Guide)

### 1. The Tamper-Proof Challenge (Most Convincing Moment)
1. Log in as **MVGR College of Engineering** (`mvgr@domain.com` / `oxford123`).
2. Approve a student certificate request and click **Issue Certificate**.
3. Download the generated E-Certificate PDF. Notice the **embedded Verification QR Code**, rearranged photo frame, and **SHA-256 hash value**.
4. Go to the public **Verify** home page and drag & drop the PDF. The system will display **Certificate Verified** with a green shield!
5. Open the certificate PDF in a text editor, modify one character in the student's name, and save.
6. Upload the modified PDF again on the **Verify** page. The system will alert **Verification Failure: TAMPER WARNING** in red.

### 2. QR Code Smartphone Verification
1. Scan the embedded **QR Code** on the bottom right of the PDF using any mobile camera.
2. It will directly navigate to the public verification endpoint (`/verify-by-id?id=...`) showing full on-chain proof.

### 3. Institutional Whitelisting & Deauthorization
1. Log in as **System Admin** (`admin@system.com` / `admin123`).
2. Under **Affiliated College Whitelist**, view all registered colleges.
3. Click **Remove** next to an institution to revoke its authorization on-chain and delete the record.
