const dns = require("dns");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

let pool = null;
try {
  let dbUrl = process.env.DATABASE_URL || "";
  // Auto-switch Supabase direct port 5432 to Connection Pooler port 6543 for IPv4 compatibility on Render/cloud hosts
  if (dbUrl.includes("supabase.co:5432")) {
    dbUrl = dbUrl.replace("supabase.co:5432", "supabase.co:6543");
  }

  const needsSSL = dbUrl.includes("supabase.co") || dbUrl.includes("render.com") || dbUrl.includes("neon.tech") || dbUrl.includes("sslmode=require") || process.env.NODE_ENV === "production";
  
  pool = new Pool({
    connectionString: dbUrl,
    ssl: needsSSL ? { rejectUnauthorized: false } : false
  });
  console.log("[DB Config] Initialized PostgreSQL connection pool.");
} catch (error) {
  console.error("[DB Config] Error initializing Postgres pool:", error);
}

async function initSchema() {
  if (!pool) return;
  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, "utf8");
      await pool.query(sql);
      console.log("[DB Config] ✅ Database schema verified and updated successfully.");
    }
  } catch (err) {
    console.warn("[DB Config] ⚠️ Schema initialization notice:", err.message);
  }
}

// Run schema initialization asynchronously
initSchema();

/**
 * Standard query function that executes against PostgreSQL.
 */
async function query(text, params = []) {
  if (!pool) {
    throw new Error("[DB Error] PostgreSQL pool is not initialized. Check DATABASE_URL.");
  }
  return await pool.query(text, params);
}

module.exports = {
  query,
  initSchema
};
