import React from "react";
import { Award, Shield, FileText, CheckCircle, AlertTriangle, Clock } from "lucide-react";

const getIcon = (type) => {
  switch (type) {
    case "CREATED":
      return <Award className="h-5 w-5 text-blue-600" />;
    case "BLOCKCHAIN":
      return <Shield className="h-5 w-5 text-indigo-600" />;
    case "IPFS":
      return <FileText className="h-5 w-5 text-cyan-600" />;
    case "VERIFIED":
      return <CheckCircle className="h-5 w-5 text-emerald-600" />;
    case "REVOKED":
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    default:
      return <Clock className="h-5 w-5 text-slate-500" />;
  }
};

export default function CertificateTimeline({ events = [] }) {
  if (!events || events.length === 0) {
    return <div className="text-center py-6 text-xs text-slate-400">No lifecycle activity events found.</div>;
  }

  return (
    <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 my-4">
      {events.map((event, idx) => (
        <div key={idx} className="relative group">
          {/* Timeline Dot Icon */}
          <div className="absolute -left-[35px] top-0 p-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
            {getIcon(event.type)}
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800 text-sm">{event.title}</span>
              <span className="text-[10px] font-semibold text-slate-400">
                {new Date(event.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600 font-medium leading-relaxed">{event.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
