const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DB_MOCK_PATH = path.join(__dirname, "../storage/db_mock.json");
const LEDGER_PATH = path.join(__dirname, "../storage/blockchain_ledger.json");

async function seed() {
  console.log("Starting mock data seeding...");

  // Generate bcrypt hashes for passwords
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("student123", salt);
  const instPasswordHash = await bcrypt.hash("oxford123", salt);
  const pendingPasswordHash = await bcrypt.hash("pending123", salt);

  // 1. Seed Database Mock (db_mock.json)
  const student1Id = "student-uuid-jane-doe-2026";
  const student2Id = "student-uuid-saiku-kumar-2026";
  const inst1Id = "inst-uuid-oxford-2026";
  const inst2Id = "inst-uuid-harvard-2026";
  const instJntugvId = "inst-uuid-jntugv-2026";
  const instPendingId = "inst-uuid-pending-2026";

  const dbMockData = {
    institutions: [
      {
        id: inst1Id,
        name: "Oxford University",
        wallet_address: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
        email: "oxford@domain.com",
        password_hash: instPasswordHash,
        status: "approved",
        is_verified: true,
        otp_code: null,
        created_at: new Date().toISOString()
      },
      {
        id: inst2Id,
        name: "Harvard University",
        wallet_address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        email: "harvard@domain.com",
        password_hash: instPasswordHash,
        status: "approved",
        is_verified: true,
        otp_code: null,
        created_at: new Date().toISOString()
      },
      {
        id: instJntugvId,
        name: "Jawaharlal Nehru Technological University Gurajada Vizianagaram \n (Established by Andhra Pradesh Act No.22 of 2021)",
        wallet_address: "0x5b38da6a701c568545dcfcb03fcb875f56beddc4",
        email: "jntugv_college@domain.com",
        password_hash: instPasswordHash,
        status: "approved",
        is_verified: true,
        otp_code: null,
        created_at: new Date().toISOString()
      },
      {
        id: instPendingId,
        name: "Pending State University",
        wallet_address: "0x3c44cdde86a900fa2b585dd299e03d12fa4293bd",
        email: "pending_uni@domain.com",
        password_hash: pendingPasswordHash,
        status: "pending",
        is_verified: false,
        otp_code: null,
        created_at: new Date().toISOString()
      }
    ],
    students: [
      {
        id: student1Id,
        registration_number: "REG2026001",
        name: "Jane Doe",
        email: "student@domain.com",
        password_hash: passwordHash,
        is_verified: true,
        otp_code: null,
        created_at: new Date().toISOString()
      },
      {
        id: student2Id,
        registration_number: "REG2026042",
        name: "Saiku Kumar",
        email: "saiku@domain.com",
        password_hash: passwordHash,
        is_verified: true,
        otp_code: null,
        created_at: new Date().toISOString()
      }
    ],
    certificates: [],
    certificate_requests: []
  };

  // 2. Seed Blockchain Mock (blockchain_ledger.json)
  const ledgerData = {
    admin: "0xAdmin00000000000000000000000000000000001",
    authorizedIssuers: {
      "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc": true,
      "0x70997970c51812dc3a010c7d01b50e0d17dc79c8": true,
      "0x5b38da6a701c568545dcfcb03fcb875f56beddc4": true,
      "0x3c44cdde86a900fa2b585dd299e03d12fa4293bd": false // pending
    },
    certificates: {},
    transactions: []
  };

  // Ensure directories exist
  const storageDir = path.join(__dirname, "../storage");
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  // Write files
  fs.writeFileSync(DB_MOCK_PATH, JSON.stringify(dbMockData, null, 2), "utf8");
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledgerData, null, 2), "utf8");

  console.log("Mock data successfully seeded!");
  console.log(`- Database file written to: ${DB_MOCK_PATH}`);
  console.log(`- Blockchain ledger written to: ${LEDGER_PATH}`);
}

seed().catch(err => {
  console.error("Seeding failed:", err);
});
