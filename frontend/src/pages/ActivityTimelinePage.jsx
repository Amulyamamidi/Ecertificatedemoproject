import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock, ShieldCheck, ArrowLeft } from "lucide-react";
import CertificateTimeline from "../components/CertificateTimeline";
import { API_BASE_URL } from "../context/AuthContext";

export default function ActivityTimelinePage() {
  const { certId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (certId) {
      const baseUrl = API_BASE_URL.replace(/\/v1$/, "");
      fetch(`${baseUrl}/api/timeline/${certId}`)
        .then((res) => res.json())
        .then((resData) => {
          if (resData.timeline) setData(resData);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [certId]);

  return (
    <div className="py-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-blue-950 flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-700" /> Certificate Lifecycle Activity Timeline
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {certId}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">Constructing lifecycle event timeline...</div>
        ) : !data ? (
          <div className="text-center py-8 text-xs text-slate-400">Certificate timeline not found.</div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Candidate</span>
                <h3 className="font-extrabold text-blue-950 text-base">{data.certificate.student_name}</h3>
                <p className="text-slate-600 font-medium">{data.certificate.course_name} ({data.certificate.grade})</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                data.certificate.status === "revoked" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
              }`}>
                {data.certificate.status}
              </span>
            </div>

            <CertificateTimeline events={data.timeline} />
          </div>
        )}
      </div>
    </div>
  );
}
