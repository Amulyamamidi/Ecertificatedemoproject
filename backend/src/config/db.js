const fs = require("fs");
const path = require("path");
const dns = require("dns");
const { Pool } = require("pg");

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const MOCK_DB_PATH = path.join(__dirname, "../../storage/db_mock.json");

// Helper to load mock DB safely
function getMockDb() {
  try {
    if (!fs.existsSync(path.dirname(MOCK_DB_PATH))) {
      fs.mkdirSync(path.dirname(MOCK_DB_PATH), { recursive: true });
    }
    if (!fs.existsSync(MOCK_DB_PATH)) {
      fs.writeFileSync(
        MOCK_DB_PATH,
        JSON.stringify({
          institutions: [],
          students: [],
          certificates: [],
          certificate_requests: []
        }, null, 2)
      );
    }
    const db = JSON.parse(fs.readFileSync(MOCK_DB_PATH, "utf8"));
    return {
      institutions: Array.isArray(db.institutions) ? db.institutions : [],
      students: Array.isArray(db.students) ? db.students : [],
      certificates: Array.isArray(db.certificates) ? db.certificates : [],
      certificate_requests: Array.isArray(db.certificate_requests) ? db.certificate_requests : []
    };
  } catch (e) {
    return { institutions: [], students: [], certificates: [], certificate_requests: [] };
  }
}

function saveMockDb(data) {
  try {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("[Mock DB] Save error:", e.message);
  }
}

let pool = null;
const isMock = process.env.USE_MOCK_SERVICES === "true";

if (!isMock) {
  try {
    const dbUrl = process.env.DATABASE_URL || "";
    const needsSSL = dbUrl.includes("supabase.co") || dbUrl.includes("render.com") || dbUrl.includes("neon.tech") || dbUrl.includes("sslmode=require") || process.env.NODE_ENV === "production";
    
    pool = new Pool({
      connectionString: dbUrl,
      ssl: needsSSL ? { rejectUnauthorized: false } : false
    });
    console.log("[DB Config] Initialized PostgreSQL connection pool.");
  } catch (error) {
    console.error("[DB Config] Error initializing Postgres pool:", error);
  }
}

/**
 * Standard query function that mirrors pg.Pool.query.
 * Supports a mock SQL parser for standard queries when offline.
 */
async function query(text, params = []) {
  if (isMock) {
    return runMockQuery(text, params);
  }

  if (!pool) {
    throw new Error("PostgreSQL connection pool not initialized.");
  }
  return pool.query(text, params);
}

/**
 * A simple regex-based mock SQL query processor for offline execution.
 */
function runMockQuery(text, params = []) {
  const db = getMockDb();
  const normalizedQuery = (text || "").replace(/\s+/g, " ").trim().toLowerCase();
  
  // 1. SELECT * FROM institutions WHERE email = $1
  if (normalizedQuery.includes("select * from institutions where email =")) {
    const email = (params[0] || "").toLowerCase();
    const rows = db.institutions.filter(inst => inst && inst.email && inst.email.toLowerCase() === email);
    return { rows };
  }

  // 2. INSERT INTO institutions
  if (normalizedQuery.startsWith("insert into institutions")) {
    const [name, wallet_address, email, password_hash, status, is_verified, otp_code] = params;
    const newInst = {
      id: require("crypto").randomUUID(),
      name,
      wallet_address,
      email,
      password_hash,
      status: status || "pending",
      is_verified: is_verified === true || is_verified === "true" || status === "approved",
      otp_code: otp_code || null,
      created_at: new Date().toISOString()
    };
    db.institutions.push(newInst);
    saveMockDb(db);
    return { rows: [newInst] };
  }

  // 3. SELECT * FROM students WHERE email = $1
  if (normalizedQuery.includes("select * from students where email =")) {
    const email = (params[0] || "").toLowerCase();
    const rows = db.students.filter(stud => stud && stud.email && stud.email.toLowerCase() === email);
    return { rows };
  }

  // 4. INSERT INTO students
  if (normalizedQuery.startsWith("insert into students")) {
    const [registration_number, name, email, password_hash, is_verified, otp_code] = params;
    const newStud = {
      id: require("crypto").randomUUID(),
      registration_number,
      name,
      email,
      password_hash,
      is_verified: is_verified === true || is_verified === "true",
      otp_code: otp_code || null,
      created_at: new Date().toISOString()
    };
    db.students.push(newStud);
    saveMockDb(db);
    return { rows: [newStud] };
  }

  // 5. SELECT certificate details by cert_id (with joins)
  if (normalizedQuery.includes("from certificates") && (normalizedQuery.includes("c.cert_id =") || normalizedQuery.includes("cert_id ="))) {
    const certId = (params[0] || "").toLowerCase();
    const certs = db.certificates.filter(c => c && c.cert_id && c.cert_id.toLowerCase() === certId);
    const rows = certs.map(c => {
      const inst = db.institutions.find(i => i && i.id === c.institution_id);
      const stud = db.students.find(s => s && s.id === c.student_id);
      return {
        ...c,
        institution_name: inst ? inst.name : "Unknown Institution",
        registration_number: stud ? stud.registration_number : "N/A"
      };
    });
    return { rows };
  }

  // 6. INSERT INTO certificates
  if (normalizedQuery.startsWith("insert into certificates")) {
    const [cert_id, institution_id, student_id, student_name, course_name, grade, cert_hash, ipfs_cid, tx_hash] = params;
    const newCert = {
      cert_id,
      institution_id,
      student_id,
      student_name,
      course_name,
      grade,
      cert_hash,
      ipfs_cid,
      tx_hash,
      status: "issued",
      issued_at: new Date().toISOString()
    };
    db.certificates.push(newCert);
    saveMockDb(db);
    return { rows: [newCert] };
  }

  // 7. SELECT certificates for student
  if (normalizedQuery.includes("from certificates c") && normalizedQuery.includes("c.student_id =")) {
    const studentId = params[0];
    const rows = db.certificates
      .filter(c => c && c.student_id === studentId)
      .map(c => {
        const inst = db.institutions.find(i => i && i.id === c.institution_id);
        return { ...c, institution_name: inst ? inst.name : "Unknown Institution" };
      });
    return { rows };
  }

  // 8. SELECT certificates for institution
  if (normalizedQuery.includes("from certificates c") && (normalizedQuery.includes("c.institution_id =") || normalizedQuery.includes("institution_id ="))) {
    const instId = params[0];
    const rows = db.certificates
      .filter(c => c && c.institution_id === instId)
      .map(c => {
        const stud = db.students.find(s => s && s.id === c.student_id);
        return { ...c, registration_number: stud ? stud.registration_number : "N/A" };
      });
    return { rows };
  }

  // 9. UPDATE certificates SET status = 'revoked'
  if (normalizedQuery.includes("update certificates set status = 'revoked' where cert_id =")) {
    const certId = (params[0] || "").toLowerCase();
    let updated = false;
    db.certificates = db.certificates.map(c => {
      if (c && c.cert_id && c.cert_id.toLowerCase() === certId) {
        c.status = "revoked";
        updated = true;
      }
      return c;
    });
    if (updated) saveMockDb(db);
    return { rowCount: updated ? 1 : 0 };
  }

  // 10. UPDATE institutions SET status = 'approved'
  if (normalizedQuery.includes("update institutions set status = 'approved' where id =")) {
    const instId = params[0];
    let updated = false;
    db.institutions = db.institutions.map(inst => {
      if (inst && inst.id === instId) {
        inst.status = "approved";
        updated = true;
      }
      return inst;
    });
    if (updated) saveMockDb(db);
    return { rowCount: updated ? 1 : 0 };
  }

  // 11a. SELECT approved institutions for dropdown
  if (normalizedQuery.includes("from institutions") && normalizedQuery.includes("status = 'approved'")) {
    const rows = db.institutions.filter(inst => inst && inst.status === "approved");
    return { rows };
  }

  // 11b. SELECT pending institutions
  if (normalizedQuery.includes("from institutions") && normalizedQuery.includes("status = 'pending'")) {
    const rows = db.institutions.filter(inst => inst && inst.status === "pending");
    return { rows };
  }

  // 11c. SELECT all institutions (general list)
  if (normalizedQuery.includes("from institutions")) {
    const rows = [...db.institutions].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return { rows };
  }

  // 12. SELECT students
  if (normalizedQuery.includes("from students")) {
    return { rows: db.students };
  }

  // 14. INSERT INTO certificate_requests
  if (normalizedQuery.startsWith("insert into certificate_requests")) {
    const [student_id, institution_id, roll_number, course_name, grade] = params;
    const newReq = {
      id: require("crypto").randomUUID(),
      student_id,
      institution_id,
      roll_number,
      course_name,
      grade: grade || "A",
      status: "pending_college",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.certificate_requests.push(newReq);
    saveMockDb(db);
    return { rows: [newReq] };
  }

  // 15. SELECT student applications
  if (normalizedQuery.includes("from certificate_requests cr") && normalizedQuery.includes("cr.student_id =")) {
    const studentId = params[0];
    const rows = db.certificate_requests
      .filter(r => r && r.student_id === studentId)
      .map(r => {
        const inst = db.institutions.find(i => i && i.id === r.institution_id);
        return {
          ...r,
          institution_name: inst ? inst.name : "Unknown College"
        };
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return { rows };
  }

  // 16. SELECT pending college applications
  if (normalizedQuery.includes("from certificate_requests cr") && normalizedQuery.includes("cr.institution_id =") && normalizedQuery.includes("cr.status = 'pending_college'")) {
    const instId = params[0];
    const rows = db.certificate_requests
      .filter(r => r && r.institution_id === instId && r.status === "pending_college")
      .map(r => {
        const stud = db.students.find(s => s && s.id === r.student_id);
        return {
          ...r,
          student_name: stud ? stud.name : "Unknown Student"
        };
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return { rows };
  }

  // 17. SELECT approved college applications pending admin
  if (normalizedQuery.includes("from certificate_requests cr") && normalizedQuery.includes("cr.status = 'approved_by_college'")) {
    const rows = db.certificate_requests
      .filter(r => r && r.status === "approved_by_college")
      .map(r => {
        const inst = db.institutions.find(i => i && i.id === r.institution_id);
        const stud = db.students.find(s => s && s.id === r.student_id);
        return {
          ...r,
          institution_name: inst ? inst.name : "Unknown College",
          student_name: stud ? stud.name : "Unknown Student",
          registration_number: stud ? stud.registration_number : "N/A"
        };
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return { rows };
  }

  // 18. UPDATE certificate_requests SET status
  if (normalizedQuery.includes("update certificate_requests set status =") || normalizedQuery.includes("update certificate_requests set status=")) {
    const status = params[0];
    const id = params[1];
    let updated = false;
    db.certificate_requests = db.certificate_requests.map(r => {
      if (r && r.id === id) {
        r.status = status;
        r.updated_at = new Date().toISOString();
        updated = true;
      }
      return r;
    });
    if (updated) saveMockDb(db);
    return { rowCount: updated ? 1 : 0 };
  }

  // 19. SELECT single certificate request details
  if (normalizedQuery.includes("from certificate_requests cr") && (normalizedQuery.includes("cr.id =") || normalizedQuery.includes("cr.id="))) {
    const id = params[0];
    const match = db.certificate_requests.find(r => r && r.id === id);
    if (!match) return { rows: [] };
    
    const inst = db.institutions.find(i => i && i.id === match.institution_id);
    const stud = db.students.find(s => s && s.id === match.student_id);
    const row = {
      ...match,
      institution_wallet: inst ? inst.wallet_address : "",
      institution_name: inst ? inst.name : "Unknown College",
      student_name: stud ? stud.name : "Unknown Student",
      student_email: stud ? stud.email : "",
      registration_number: stud ? stud.registration_number : "N/A"
    };
    return { rows: [row] };
  }

  // 20. UPDATE students set is_verified = true
  if (normalizedQuery.includes("update students") && (normalizedQuery.includes("is_verified = true") || normalizedQuery.includes("is_verified=true"))) {
    const email = (params[0] || "").toLowerCase();
    let updated = false;
    db.students = db.students.map(s => {
      if (s && s.email && s.email.toLowerCase() === email) {
        s.is_verified = true;
        s.otp_code = null;
        updated = true;
      }
      return s;
    });
    if (updated) saveMockDb(db);
    return { rowCount: updated ? 1 : 0 };
  }

  // 21. UPDATE institutions set is_verified = true
  if (normalizedQuery.includes("update institutions") && (normalizedQuery.includes("is_verified = true") || normalizedQuery.includes("is_verified=true"))) {
    const email = (params[0] || "").toLowerCase();
    let updated = false;
    db.institutions = db.institutions.map(inst => {
      if (inst && inst.email && inst.email.toLowerCase() === email) {
        inst.is_verified = true;
        inst.otp_code = null;
        updated = true;
      }
      return inst;
    });
    if (updated) saveMockDb(db);
    return { rowCount: updated ? 1 : 0 };
  }

  return { rows: [] };
}

module.exports = {
  query
};
