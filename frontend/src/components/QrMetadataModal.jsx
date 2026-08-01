import React from "react";
import { ShieldCheck, ExternalLink, X, FileText, CheckCircle2, Clock } from "lucide-react";

export default function QrMetadataModal({ isOpen, onClose, metadata, onChainDetails, certId }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-blue-100">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-lg">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            Verified QR Metadata Details
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Status: Authentic & Valid
            </span>
            <span className="text-[10px] text-emerald-700">Polygon Amoy Testnet</span>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Student Name</span>
              <p className="font-semibold text-slate-800">{metadata?.studentName || "Verified Student"}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Degree / Course</span>
              <p className="font-semibold text-slate-800">{metadata?.courseName || "Academic Credential"}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Grade / Division</span>
              <p className="font-semibold text-slate-800">{metadata?.grade || "Passed"}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Issuing Institution</span>
              <p className="font-semibold text-slate-800">{metadata?.institutionName || "JNTUGV Constituent College"}</p>
            </div>
          </div>

          <div className="space-y-2 bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] break-all">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-sans">Certificate Verification ID</span>
              <span className="text-blue-300 font-bold">{certId}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-sans">SHA-256 PDF Hash</span>
              <span className="text-emerald-400">{onChainDetails?.certHash || "On-Chain Verified"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-sans">IPFS Storage CID</span>
              <a
                href={onChainDetails?.ipfsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-300 hover:underline flex items-center gap-1 mt-0.5"
              >
                <FileText className="h-3 w-3" /> {onChainDetails?.ipfsCID} <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>
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
