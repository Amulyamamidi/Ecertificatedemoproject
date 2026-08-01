import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import VerifyPage from "./pages/VerifyPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import InstitutionDashboard from "./pages/InstitutionDashboard";
import StudentPortal from "./pages/StudentPortal";
import AdminDashboard from "./pages/AdminDashboard";

// New Feature Pages
import AuditLogsPage from "./pages/AuditLogsPage";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import BulkUploadPage from "./pages/BulkUploadPage";
import VerificationLogsPage from "./pages/VerificationLogsPage";
import ActivityTimelinePage from "./pages/ActivityTimelinePage";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-slate-50/50">
          <Navbar />
          
          <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<VerifyPage />} />
              <Route path="/verify-by-id" element={<VerifyPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/timeline/:certId" element={<ActivityTimelinePage />} />
              
              {/* Protected Institution Routes */}
              <Route
                path="/institution"
                element={
                  <ProtectedRoute allowedRoles={["institution"]}>
                    <InstitutionDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/institution/bulk-upload"
                element={
                  <ProtectedRoute allowedRoles={["institution", "admin"]}>
                    <BulkUploadPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Student Routes */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <StudentPortal />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminAnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/verification-logs"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <VerificationLogsPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback to Verify Page */}
              <Route path="*" element={<VerifyPage />} />
            </Routes>
          </main>

          {/* Premium Footer */}
          <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 font-medium">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="font-sans">
                &copy; {new Date().getFullYear()} JntuGv CertiShield Secure Audits. MCA Final Year Capstone Project.
              </span>
              <div className="flex gap-4">
                <span className="hover:text-slate-800 cursor-pointer transition">Polygon Amoy Testnet</span>
                <span className="text-slate-300">|</span>
                <span className="hover:text-slate-800 cursor-pointer transition font-mono">IPFS (Pinata)</span>
                <span className="text-slate-300">|</span>
                <span className="hover:text-slate-800 cursor-pointer transition">Zero-Cost Cloud Architecture</span>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}
