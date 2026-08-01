import React, { useState } from "react";
import { Download, FileSpreadsheet, X, FileText } from "lucide-react";
import { API_BASE_URL } from "../context/AuthContext";

export default function ExportReportModal({ isOpen, onClose }) {
  const [type, setType] = useState("issued");
  const [format, setFormat] = useState("csv");

  if (!isOpen) return null;

  const handleExport = () => {
    const token = localStorage.getItem("cert_shield_token") || localStorage.getItem("certishield_token");
    const baseUrl = API_BASE_URL.replace(/\/v1$/, "");
    const url = `${baseUrl}/api/reports/export?type=${type}&format=${format}`;
    
    // Trigger download
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `report_${type}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-lg">
            <Download className="h-6 w-6 text-blue-600" />
            Export System Reports
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Select Report Dataset
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="issued">Issued Certificates Report</option>
              <option value="revoked">Revoked Certificates Log</option>
              <option value="verification">Public Verification Activity Logs</option>
              <option value="audit">System Security Audit Logs</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={`p-3 rounded-xl border flex items-center gap-2 font-semibold transition ${
                  format === "csv" ? "bg-blue-50 border-blue-600 text-blue-900" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" /> Excel / CSV
              </button>

              <button
                type="button"
                onClick={() => setFormat("pdf")}
                className={`p-3 rounded-xl border flex items-center gap-2 font-semibold transition ${
                  format === "pdf" ? "bg-blue-50 border-blue-600 text-blue-900" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <FileText className="h-5 w-5 text-red-600" /> PDF Document
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-md"
          >
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}
