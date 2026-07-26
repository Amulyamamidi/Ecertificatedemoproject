const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DB_MOCK_PATH = path.join(__dirname, "../storage/db_mock.json");
const LEDGER_PATH = path.join(__dirname, "../storage/blockchain_ledger.json");

async function seed() {
  console.log("Starting real JNTUGV institution data seeding...");

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("student123", salt);
  const instPasswordHash = await bcrypt.hash("oxford123", salt);

  const dbMockData = {
    institutions: [
      {
        id: "inst-uuid-jntugv-main-2026",
        name: "JNTUGV University College of Engineering Vizianagaram",
        wallet_address: "0x5b38da6a701c568545dcfcb03fcb875f56beddc4",
        email: "jntugv_main@domain.com",
        password_hash: instPasswordHash,
        status: "approved",
        is_verified: true,
        otp_code: null,
        created_at: new Date().toISOString()
      },
      {
        id: "inst-uuid-mvgr-2026",
        name: "MVGR College of Engineering (Autonomous)",
        wallet_address: "0xd0e2367b49cd8536C47b7CE7C475FdE5Dd89DEA0",
        email: "mvgr@domain.com",
        password_hash: instPasswordHash,
        status: "approved",
        is_verified: true,
        otp_code: null,
        created_at: new Date().toISOString()
      },
      {
        id: "inst-uuid-gmrit-2026",
        name: "GMR Institute of Technology (GMRIT)",
        wallet_address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        email: "gmrit@domain.com",
        password_hash: instPasswordHash,
        status: "approved",
        is_verified: true,
        otp_code: null,
        created_at: new Date().toISOString()
      },
      {
        id: "inst-uuid-lendi-2026",
        name: "Lendi Institute of Engineering & Technology",
        wallet_address: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
        email: "lendi@domain.com",
        password_hash: instPasswordHash,
        status: "approved",
        is_verified: true,
        otp_code: null,
        created_at: new Date().toISOString()
      }
    ],
    students: [
      {
        id: "student-uuid-jane-doe-2026",
        registration_number: "REG2026001",
        name: "Jane Doe",
        email: "student@domain.com",
        password_hash: passwordHash,
        is_verified: true,
        otp_code: null,
        created_at: new Date().toISOString()
      },
      {
        id: "student-uuid-saiku-kumar-2026",
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

  const ledgerData = {
    admin: "0xAdmin00000000000000000000000000000000001",
    authorizedIssuers: {
      "0x5b38da6a701c568545dcfcb03fcb875f56beddc4": true,
      "0xd0e2367b49cd8536C47b7CE7C475FdE5Dd89DEA0": true,
      "0x70997970c51812dc3a010c7d01b50e0d17dc79c8": true,
      "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc": true
    },
    certificates: {},
    transactions: []
  };

  const storageDir = path.join(__dirname, "../storage");
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  fs.writeFileSync(DB_MOCK_PATH, JSON.stringify(dbMockData, null, 2), "utf8");
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledgerData, null, 2), "utf8");

  console.log("Mock data successfully seeded with real JNTUGV colleges!");
}

seed().catch(err => {
  console.error("Seeding failed:", err);
});
