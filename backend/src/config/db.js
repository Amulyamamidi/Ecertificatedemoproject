const dns = require("dns");
const { Pool } = require("pg");

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

let pool = null;
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
  query
};
