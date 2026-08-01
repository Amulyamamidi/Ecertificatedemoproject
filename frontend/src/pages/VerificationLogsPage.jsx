import React, { useState, useEffect } from "react";
import { FileCheck, Search, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "../context/AuthContext";

export default function VerificationLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const baseUrl = API_BASE_URL.replace(/\/v1$/, "");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cert_shield_token") || localStorage.getItem("certishield_token");
      const res = await fetch(`${baseUrl}/api/verification-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.verificationLogs) setLogs(data.verificationLogs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-blue-950 flex items-center gap-2">
            <FileCheck className="h-7 w-7 text-emerald-600" /> Public Verification Attempts Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tracks IP addresses, browser agents, devices, and results for every credential verification check.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Certificate ID</th>
                <th className="p-4">Verification Result</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Device / Platform</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                    Loading verification logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                    No verification attempt logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 text-slate-500 font-mono text-[10px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-mono font-bold text-blue-600">{log.cert_id || "PDF File Scan"}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        log.verification_result === "VALID"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}>
                        {log.verification_result}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-[10px]">{log.ip_address}</td>
                    <td className="p-4 text-slate-600 font-medium">{log.device || "Browser"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
