import React from "react";
import { Search, Filter, RotateCcw } from "lucide-react";

export default function AdvancedSearchFilters({ filters, onChange, onReset }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
        <Filter className="h-4 w-4 text-blue-600" /> Advanced Certificate Filters
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Student Name / ID</label>
          <input
            type="text"
            value={filters.search || ""}
            onChange={(e) => onChange("search", e.target.value)}
            placeholder="Search student or cert ID..."
            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Course / Dept</label>
          <input
            type="text"
            value={filters.course || ""}
            onChange={(e) => onChange("course", e.target.value)}
            placeholder="e.g. Computer Science"
            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
          <select
            value={filters.status || ""}
            onChange={(e) => onChange("status", e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="issued">Issued</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={onReset}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center justify-center gap-1 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
