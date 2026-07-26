const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_token_for_certificate_system_2026";

/**
 * Verifies the user is authenticated via JWT.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: "Access token is missing." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token is invalid or expired." });
    }
    req.user = user;
    next();
  });
}

/**
 * Verifies the authenticated user has the 'institution' role.
 */
function requireInstitution(req, res, next) {
  if (req.user && req.user.role === "institution") {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Institution role required." });
  }
}

/**
 * Verifies the authenticated user has the 'student' role.
 */
function requireStudent(req, res, next) {
  if (req.user && req.user.role === "student") {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Student role required." });
  }
}

/**
 * Verifies the user is the Admin.
 * For this student project, we can make the admin a special username/email in JWT
 * or a hardcoded check (e.g. email = admin@system.com or username = admin).
 */
function requireAdmin(req, res, next) {
  if (req.user && (req.user.role === "admin" || req.user.email === "jntugv@system.com" || req.user.email === "admin@system.com")) {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Admin access required." });
  }
}

module.exports = {
  authenticateToken,
  requireInstitution,
  requireStudent,
  requireAdmin
};
