import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, API_BASE_URL } from "../context/AuthContext";
import { Shield, Mail, Lock, User, Landmark, CreditCard, UserPlus, RefreshCw, AlertCircle, CheckCircle, KeyRound } from "lucide-react";

export default function RegisterPage() {
  const [role, setRole] = useState("student"); // "student" or "institution"
  
  // Student fields
  const [name, setName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  
  // Institution fields
  const [instName, setInstName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  
  // Shared fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP Fields
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otp, setOtp] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationRole, setVerificationRole] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (role === "student") {
      if (!name || !registrationNumber || !email || !password) {
        return setError("Please fill out all student fields.");
      }
    } else {
      if (!instName || !walletAddress || !email || !password) {
        return setError("Please fill out all institution fields.");
      }
      if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
        return setError("Please enter a valid Ethereum wallet address (0x followed by 40 hex characters).");
      }
    }

    setLoading(true);

    try {
      const payload = role === "student" 
        ? { name, registrationNumber, email, password }
        : { name: instName, walletAddress, email, password };

      await register(payload, role);

      setVerificationEmail(email);
      setVerificationRole(role);
      setShowOtpScreen(true);
      setSuccess("Registration successful! A verification code has been sent to your email.");
    } catch (err) {
      setError(err.message || "Registration failed.");
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
        setSuccess("Email verified successfully! Redirecting to login page...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setSuccess("Email verified successfully! Your institution account is pending admin approval. You can sign in once approved.");
        setTimeout(() => navigate("/login"), 4500);
      }
      setOtp("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <img 
            src="/jntugv_logo.png" 
            alt="JNTUGV Logo" 
            className="h-16 w-16 object-contain rounded-2xl shadow-md border border-slate-200 bg-white p-1" 
          />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
        <div className="bg-white py-8 px-4 border border-slate-200/80 shadow-xl rounded-3xl sm:px-10">
          
          {showOtpScreen ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Verify your Email</h3>
              <p className="text-sm text-slate-500">
                We've sent a 6-digit verification code to <span className="font-semibold text-slate-800">{verificationEmail}</span>.
              </p>
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200 font-medium">
                🔔 Please check your backend terminal console logs to retrieve the OTP code!
              </p>

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
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 text-left animate-shake">
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
                  Cancel and Register again
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                <button
                  onClick={() => { setRole("student"); setError(""); setSuccess(""); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    role === "student" ? "bg-white text-brand-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Student Sign Up
                </button>
                <button
                  onClick={() => { setRole("institution"); setError(""); setSuccess(""); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    role === "institution" ? "bg-white text-brand-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Institution Registration
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Student Specific Fields */}
                {role === "student" && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Full Name</label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User className="h-5 w-5" />
                        </div>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Arjun Naidu"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Registration / Roll Number</label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <input
                          type="text"
                          required
                          value={registrationNumber}
                          onChange={(e) => setRegistrationNumber(e.target.value)}
                          placeholder="MCA2026042"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Institution Specific Fields */}
                {role === "institution" && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Institution Name</label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Landmark className="h-5 w-5" />
                        </div>
                        <input
                          type="text"
                          required
                          value={instName}
                          onChange={(e) => setInstName(e.target.value)}
                          placeholder="JNTU GV"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Ethereum Wallet Address</label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <input
                          type="text"
                          required
                          value={walletAddress}
                          onChange={(e) => setWalletAddress(e.target.value)}
                          placeholder="0x97bF... (MetaMask address)"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150 font-mono"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Your institutional public wallet address. Transactions on-chain must reference this wallet.
                      </p>
                    </div>
                  </>
                )}

                {/* Shared Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@domain.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                    />
                  </div>
                </div>

                {/* Shared Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Password</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2">
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
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      Sign Up
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
