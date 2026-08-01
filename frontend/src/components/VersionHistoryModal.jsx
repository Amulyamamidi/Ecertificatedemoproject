import React, { useEffect, useState } from "react";
import { History, X, GitCommit } from "lucide-react";
import { API_BASE_URL } from "../context/AuthContext";

export default function VersionHistoryModal({ certId, isOpen, onClose }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && certId) {
      setLoading(true);
      const baseUrl = API_BASE_URL.replace(/\/v1$/, "");
      fetch(`${baseUrl}/api/versions/${certId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.versions) setVersions(data.versions);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, certId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-lg">
            <History className="h-6 w-6 text-blue-600" />
            Certificate Version History
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-6 text-xs text-slate-500 font-semibold">Loading history...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
              No previous version modifications recorded. Version 1.0 (Initial Issue).
            </div>
          ) : (
            versions.map((ver, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5 text-blue-800">
                    <GitCommit className="h-4 w-4" /> Version {ver.version_number}
                  </span>
                  <span className="text-[10px] text-slate-500">{new Date(ver.created_at).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 text-slate-600 font-medium">Reason: {ver.reason}</p>
                <div className="mt-2 font-mono text-[10px] bg-white p-2 rounded border border-slate-200 text-slate-500 break-all space-y-1">
                  {ver.prev_hash && <div><span className="text-slate-400">Prev Hash:</span> {ver.prev_hash}</div>}
                  <div><span className="text-blue-600 font-semibold">New Hash:</span> {ver.new_hash}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
