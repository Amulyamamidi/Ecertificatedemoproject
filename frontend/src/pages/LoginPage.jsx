import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, API_BASE_URL } from "../context/AuthContext";
import { Shield, Mail, Lock, LogIn, RefreshCw, AlertCircle, CheckCircle, KeyRound, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [role, setRole] = useState("student"); // "student", "institution", "admin"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP Verification States (in case they login with unverified email)  // OTP Fields
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otp, setOtp] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationRole, setVerificationRole] = useState("");
  const [receivedDemoOtp, setReceivedDemoOtp] = useState("");

  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: request OTP, 2: reset password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      return setError("Email and password are required.");
    }

    setLoading(true);

    try {
      const user = await login(email, password, role);
      
      if (role === "admin") {
        navigate("/admin");
      } else if (role === "institution") {
        navigate("/institution");
      } else {
        navigate("/student");
      }
    } catch (err) {
      if (err.needsVerification) {
        setVerificationEmail(err.email || email);
        setVerificationRole(err.role || role);
        if (err.demoOtp) {
          setReceivedDemoOtp(err.demoOtp);
        }
        setShowOtpScreen(true);
        setSuccess("Email verification required.");
      } else {
        setError(err.message || "Invalid credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      return setError("Please enter the full 6-digit verification code.");
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: verificationEmail,
          otp,
          role: verificationRole
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Verification failed.");

      if (verificationRole === "student") {
        setSuccess("Email verified successfully! You can now sign in.");
      } else {
        setSuccess("Email verified successfully! Your account is pending admin approval.");
      }
      setOtp("");
      setShowOtpScreen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestForgotOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      return setError("Please enter your registered email address.");
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/request-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: forgotEmail,
          role
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send reset OTP.");

      if (data.demoOtp) {
        setReceivedDemoOtp(data.demoOtp);
      }
      setSuccess("Verification OTP has been sent.");
      setForgotStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotOtp || forgotOtp.length !== 6) {
      return setError("Please enter the complete 6-digit OTP code.");
    }
    if (!newPassword || newPassword.length < 6) {
      return setError("New password must be at least 6 characters long.");
    }
    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match. Please try again.");
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: forgotEmail,
          role,
          otp: forgotOtp,
          newPassword
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Password reset failed.");

      setSuccess("Password reset successfully! Please sign in with your new password.");
      setShowForgotPassword(false);
      setForgotStep(1);
      setForgotOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setEmail(forgotEmail);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <img 
            src="/jntugv_logo.png" 
            alt="JNTUGV Logo" 
            className="h-16 w-16 object-contain rounded-2xl shadow-md border border-slate-200 bg-white p-1" 
          />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900">
          {showForgotPassword ? "Reset Password" : "Sign in to your portal"}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Or{" "}
          <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500">
            register your account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
        <div className="bg-white py-8 px-4 border border-slate-200/80 shadow-xl rounded-3xl sm:px-10">
          
          {showForgotPassword ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Forgot Password</h3>
                <p className="text-sm text-slate-500 capitalize">
                  Password recovery for <span className="font-semibold text-slate-800">{role}</span> account
                </p>
              </div>

              {forgotStep === 1 ? (
                <form onSubmit={handleRequestForgotOtp} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@university.edu"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{success}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-brand-900 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all duration-150 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        Sending Verification OTP...
                      </>
                    ) : (
                      <>
                        <Mail className="h-5 w-5" />
                        Send Verification Code
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowForgotPassword(false); setError(""); setSuccess(""); }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition duration-150 inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
                  <p className="text-xs text-slate-600 text-center">
                    A 6-digit verification code has been sent to <span className="font-semibold text-slate-900">{forgotEmail}</span>.
                  </p>

                  {receivedDemoOtp && (
                    <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-2xl text-center space-y-2 mb-4 animate-fade-in shadow-sm">
                      <p className="text-xs text-blue-700 font-medium">
                        🔑 Verification Code: <span className="font-bold text-blue-900 text-sm tracking-widest bg-blue-100/70 px-2 py-0.5 rounded-lg border border-blue-200">{receivedDemoOtp}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setForgotOtp(receivedDemoOtp)}
                        className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition-all duration-150 flex items-center justify-center gap-1.5"
                      >
                        <span>✨ Auto-Fill Code</span>
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Verification Code (OTP)</label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono text-center tracking-[0.2em] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">New Password</label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Confirm New Password</label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{success}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-brand-900 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all duration-150 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        Reset Password
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowForgotPassword(false); setError(""); setSuccess(""); }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition duration-150 inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : showOtpScreen ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Verify your Email</h3>
              <p className="text-sm text-slate-500">
                We've sent a 6-digit verification code to <span className="font-semibold text-slate-800">{verificationEmail}</span>.
              </p>
              {receivedDemoOtp && (
                <div className="p-3.5 bg-blue-50 border border-blue-200/80 rounded-2xl text-center space-y-2 animate-fade-in shadow-sm">
                  <p className="text-xs text-blue-700 font-medium">
                    🔑 Verification Code: <span className="font-bold text-blue-900 text-sm tracking-widest bg-blue-100/70 px-2 py-0.5 rounded-lg border border-blue-200">{receivedDemoOtp}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setOtp(receivedDemoOtp)}
                    className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition-all duration-150 flex items-center justify-center gap-1.5"
                  >
                    <span>✨ Auto-Fill OTP Code</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 text-left">Verification Code</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono text-center tracking-[0.2em] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 text-left">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2 text-left">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{success}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-brand-900 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all duration-150 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Verify Code
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setShowOtpScreen(false); setError(""); setSuccess(""); }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition duration-150"
                >
                  Cancel and Sign In again
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Role Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                <button
                  onClick={() => { setRole("student"); setError(""); setSuccess(""); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    role === "student" ? "bg-white text-brand-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Student
                </button>
                <button
                  onClick={() => { setRole("institution"); setError(""); setSuccess(""); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    role === "institution" ? "bg-white text-brand-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Institution
                </button>
                <button
                  onClick={() => { setRole("admin"); setError(""); setSuccess(""); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    role === "admin" ? "bg-white text-brand-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Admin
                </button>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                    Email Address
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@university.edu"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                      Password
                    </label>
                    {role !== "admin" && (
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email);
                          setShowForgotPassword(true);
                          setForgotStep(1);
                          setError("");
                          setSuccess("");
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-500 transition duration-150"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                    />
                  </div>
                </div>

                {role === "admin" && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-800">
                    Demo JNTUGV Admin Credentials: <span className="font-bold">jntugv@system.com</span> / <span className="font-bold">jntugv123</span>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{success}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-brand-900 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all duration-150 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Verifying Session...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5" />
                      Sign In
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
