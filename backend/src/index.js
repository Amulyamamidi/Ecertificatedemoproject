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
    version: "1.0.0",
    mockMode: process.env.USE_MOCK_SERVICES === "true"
  });
});

// Register routers
app.use("/v1/auth", authRouter);
app.use("/v1/admin", adminRouter);
app.use("/v1/institutions", institutionsRouter);
app.use("/v1/students", studentsRouter);
app.use("/v1/verify", verifyRouter);

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
  console.log(`📁 Mock Mode: ${process.env.USE_MOCK_SERVICES === "true" ? "ACTIVE (Offline)" : "INACTIVE (Production)"}`);
  console.log(`==================================================`);
});
