import React, { useState } from "react";
import { KeyRound, X, Mail, CheckCircle } from "lucide-react";
import { useAuth, API_BASE_URL } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function OtpLoginModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1: Email input, 2: OTP input
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const baseUrl = API_BASE_URL.replace(/\/v1$/, "");

  if (!isOpen) return null;

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${baseUrl}/api/otp-auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP.");

      setMessage(`6-Digit OTP sent to ${email}. Check console/email.`);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${baseUrl}/api/otp-auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP code.");

      login(data.token, data.user);
      onClose();
      if (data.user.role === "admin") navigate("/admin");
      else if (data.user.role === "institution") navigate("/institution");
      else navigate("/student");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-lg">
            <KeyRound className="h-6 w-6 text-blue-600" />
            Passwordless OTP Sign In
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="mt-4 space-y-4">
            <p className="text-xs text-slate-500">
              Enter your registered email address to receive a secure 6-digit verification code.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Account Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full text-xs border border-slate-300 rounded-xl pl-9 p-2.5 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {error && <div className="text-xs text-red-600 font-semibold">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-md disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Send Verification OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-4 space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              {message}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Enter 6-Digit OTP Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest text-lg font-mono border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            {error && <div className="text-xs text-red-600 font-semibold">{error}</div>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-md disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
