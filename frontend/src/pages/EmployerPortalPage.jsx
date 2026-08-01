import React, { useState } from "react";
import { Building2, Search, ShieldCheck, Download, ExternalLink, CheckCircle, AlertTriangle } from "lucide-react";
import { API_BASE_URL } from "../context/AuthContext";

export default function EmployerPortalPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const baseUrl = API_BASE_URL.replace(/\/v1$/, "");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${baseUrl}/api/employer/verify-candidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Verification lookup failed.");
      setResult(data.certificate);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-blue-900 text-white rounded-2xl shadow-lg">
          <Building2 className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-black text-blue-950">Employer Verification Portal</h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          Dedicated background check platform for recruiters and corporations to instantly verify academic credentials registered on the Polygon Amoy blockchain.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Enter Candidate Certificate Verification ID or SHA-256 Hash
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 0xa9f84b... or SHA-256 PDF Hash"
              className="w-full text-xs font-mono border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-md flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <Search className="h-4 w-4" /> {loading ? "Searching..." : "Verify Candidate"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold text-center">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg space-y-6">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Verification Status</span>
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2 mt-0.5">
                {result.status === "revoked" ? (
                  <span className="text-red-600 flex items-center gap-1.5">
                    <AlertTriangle className="h-6 w-6" /> CREDENTIAL REVOKED
                  </span>
                ) : (
                  <span className="text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle className="h-6 w-6" /> VERIFIED & AUTHENTIC
                  </span>
                )}
              </h2>
            </div>

            <a
              href={`${baseUrl}/api/employer/download-report/${result.cert_id}`}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-md"
            >
              <Download className="h-4 w-4" /> Download Official Employer Report PDF
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Candidate Full Name</span>
                <p className="font-bold text-slate-800 text-sm">{result.student_name}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Awarded Degree / Program</span>
                <p className="font-semibold text-slate-700">{result.course_name}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Academic Performance / Grade</span>
                <p className="font-semibold text-slate-700">{result.grade}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Issuing Institution</span>
                <p className="font-bold text-slate-800 text-sm">{result.institution_name || "JNTUGV Constituent College"}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Issue Date</span>
                <p className="font-semibold text-slate-700">{new Date(result.issued_at).toLocaleDateString()}</p>
              </div>
              {result.revocation_reason && (
                <div>
                  <span className="text-[10px] text-red-500 font-bold uppercase">Revocation Reason</span>
                  <p className="font-semibold text-red-700">{result.revocation_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
