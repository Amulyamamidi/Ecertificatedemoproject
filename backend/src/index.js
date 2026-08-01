require("dotenv").config();
const dns = require("dns");
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const express = require("express");
const cors = require("cors");
const path = require("path");

// Import Routes
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const institutionsRouter = require("./routes/institutions");
const studentsRouter = require("./routes/students");
const verifyRouter = require("./routes/verify");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all requests (crucial for React client connectivity)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets if necessary
app.use("/storage", express.static(path.join(__dirname, "../storage")));

// Base check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "healthy",
    service: "academic-certificate-verification-api",
    version: "1.0.0"
  });
});

// Register routers
app.use("/v1/auth", authRouter);
app.use("/v1/admin", adminRouter);
app.use("/v1/institutions", institutionsRouter);
app.use("/v1/students", studentsRouter);
app.use("/v1/verify", verifyRouter);

// Register New Feature Routers (supporting /api/ and /v1/ prefixes)
app.use("/api/audit-logs", require("./routes/auditLogs"));
app.use("/v1/audit-logs", require("./routes/auditLogs"));
app.use("/api/revocation", require("./routes/revocation"));
app.use("/v1/revocation", require("./routes/revocation"));
app.use("/api/versions", require("./routes/versions"));
app.use("/v1/versions", require("./routes/versions"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/v1/analytics", require("./routes/analytics"));
app.use("/api/bulk", require("./routes/bulkUpload"));
app.use("/v1/bulk", require("./routes/bulkUpload"));
app.use("/api/email-logs", require("./routes/emailLogs"));
app.use("/v1/email-logs", require("./routes/emailLogs"));
app.use("/api/otp-auth", require("./routes/otpAuth"));
app.use("/v1/otp-auth", require("./routes/otpAuth"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/v1/notifications", require("./routes/notifications"));
app.use("/api/verification-logs", require("./routes/verificationLogs"));
app.use("/v1/verification-logs", require("./routes/verificationLogs"));
app.use("/api/reports", require("./routes/reports"));
app.use("/v1/reports", require("./routes/reports"));
app.use("/api/timeline", require("./routes/timeline"));
app.use("/v1/timeline", require("./routes/timeline"));
app.use("/api/pqc", require("./routes/pqc"));
app.use("/v1/pqc", require("./routes/pqc"));

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error("[Server Error Handler]", err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error."
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 API Server running on port: ${PORT}`);
  console.log(`==================================================`);
});
