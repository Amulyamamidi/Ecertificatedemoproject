import React, { useState } from "react";
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertTriangle } from "lucide-react";
import { API_BASE_URL } from "../context/AuthContext";

export default function BulkUploadPage() {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const baseUrl = API_BASE_URL.replace(/\/v1$/, "");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split("\n").filter((l) => l.trim() !== "");
      if (lines.length <= 1) return;

      const headers = lines[0].split(",").map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const rowObj = {};
        headers.forEach((h, i) => {
          rowObj[h] = values[i] || "";
        });
        return rowObj;
      });

      setParsedRows(rows);
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (parsedRows.length === 0) return;
    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem("cert_shield_token") || localStorage.getItem("certishield_token");
      const res = await fetch(`${baseUrl}/api/bulk/process-batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rows: parsedRows,
          filename: file?.name || "bulk_upload.csv"
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process batch.");

      setResult(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-blue-950 flex items-center gap-2">
          <FileSpreadsheet className="h-7 w-7 text-emerald-600" /> Batch Bulk Certificate Upload
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload CSV files to issue certificates in bulk, pin PDFs to IPFS, and store hashes on the Ethereum ledger.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <h3 className="text-xs font-bold text-slate-800">Download Official CSV Template</h3>
            <p className="text-[11px] text-slate-500">Includes correct headers: student_name, roll_number, course_name, grade, email</p>
          </div>
          <a
            href={`${baseUrl}/api/bulk/template`}
            className="px-3.5 py-2 text-xs font-semibold text-blue-900 bg-white border border-slate-300 rounded-xl hover:bg-blue-50 flex items-center gap-1.5 shadow-xs"
          >
            <Download className="h-4 w-4 text-blue-700" /> Template CSV
          </a>
        </div>

        {/* File Dropzone */}
        <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center bg-slate-50/50 transition">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            id="csv-file-input"
            className="hidden"
          />
          <label htmlFor="csv-file-input" className="cursor-pointer space-y-2">
            <Upload className="h-10 w-10 text-blue-600 mx-auto" />
            <div className="text-xs font-bold text-slate-700">
              {file ? file.name : "Click to select or drag & drop CSV file"}
            </div>
            <p className="text-[10px] text-slate-400">Supports standard CSV files with header row</p>
          </label>
        </div>

        {parsedRows.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Preview Records ({parsedRows.length} rows loaded)
              </span>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md disabled:opacity-50"
              >
                {loading ? "Processing Batch..." : "Execute Bulk Certificate Issuance"}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[9px] sticky top-0">
                  <tr>
                    <th className="p-2.5">Student Name</th>
                    <th className="p-2.5">Roll Number</th>
                    <th className="p-2.5">Course Name</th>
                    <th className="p-2.5">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2.5 font-medium">{r.student_name || r["Student Name"]}</td>
                      <td className="p-2.5 font-mono text-[10px]">{r.roll_number || r["Roll Number"]}</td>
                      <td className="p-2.5">{r.course_name || r["Course Name"]}</td>
                      <td className="p-2.5 font-bold">{r.grade || r["Grade"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {result && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
              <CheckCircle className="h-5 w-5 text-emerald-600" /> Batch Certificate Upload Completed!
            </div>
            <p className="text-emerald-700">
              Successfully processed {result.processedRecords} of {result.totalRecords} certificate records on-chain.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
