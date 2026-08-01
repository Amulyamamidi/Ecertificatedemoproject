import React, { useState, useEffect } from "react";
import { ShieldAlert, Search, RefreshCw, Download } from "lucide-react";
import ExportReportModal from "../components/ExportReportModal";
import { API_BASE_URL } from "../context/AuthContext";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  const baseUrl = API_BASE_URL.replace(/\/v1$/, "");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cert_shield_token") || localStorage.getItem("certishield_token");
      const res = await fetch(`${baseUrl}/api/audit-logs?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-blue-950 flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-blue-700" /> Security Audit Log Explorer
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            System-wide activity logs tracking logins, certificate creations, revocations, and verification attempts.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button
            onClick={() => setExportOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl flex items-center gap-1.5 shadow-md"
          >
            <Download className="h-3.5 w-3.5" /> Export Audit Logs
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
          placeholder="Search audit action, user role, or details..."
          className="w-full text-xs border-none focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Timestamp</th>
                <th className="p-4">User Role</th>
                <th className="p-4">Action</th>
                <th className="p-4">Details</th>
                <th className="p-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                    Loading audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                    No matching audit log entries found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 text-slate-500 font-mono text-[10px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200">
                        {log.user_role}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">{log.action}</td>
                    <td className="p-4 text-slate-600 font-medium max-w-md truncate">{log.details}</td>
                    <td className="p-4 text-slate-500 font-mono text-[10px]">{log.ip_address}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExportReportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
