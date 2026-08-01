import React, { useState } from "react";
import { AlertTriangle, X, ShieldAlert } from "lucide-react";
import { API_BASE_URL } from "../context/AuthContext";

export default function RevokeCertificateModal({ certId, isOpen, onClose, onSuccess }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleRevoke = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a valid revocation reason.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("cert_shield_token") || localStorage.getItem("certishield_token");
      const baseUrl = API_BASE_URL.replace(/\/v1$/, "");
      const res = await fetch(`${baseUrl}/api/revocation/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cert_id: certId, reason })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke certificate.");

      alert("Certificate revoked successfully on database and blockchain.");
      if (onSuccess) onSuccess(certId);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-red-600 font-bold text-lg">
            <ShieldAlert className="h-6 w-6" />
            Revoke Certificate
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleRevoke} className="mt-4 space-y-4">
          <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 text-xs text-red-800">
            <span className="font-bold">Warning:</span> Revoking this certificate will invalidate it on-chain and display a REVOKED warning badge on public verification checks.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Certificate ID
            </label>
            <input
              type="text"
              readOnly
              value={certId || ""}
              className="w-full text-xs font-mono bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Revocation Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Identity discrepancy, Fraudulent document submission..."
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {error && <div className="text-xs text-red-600 font-semibold">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {loading ? "Revoking..." : "Confirm Revocation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
