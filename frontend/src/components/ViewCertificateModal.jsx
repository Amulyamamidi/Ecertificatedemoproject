import React from "react";
import { Award, X, Download, ExternalLink, ShieldCheck, ShieldAlert, Clock, Building2, User, BookOpen } from "lucide-react";

export default function ViewCertificateModal({ cert, isOpen, onClose }) {
  if (!isOpen || !cert) return null;

  const isRevoked = cert.status === "revoked";
  const ipfsUrl = cert.ipfs_cid ? `https://gateway.pinata.cloud/ipfs/${cert.ipfs_cid}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-900 text-white rounded-2xl shadow-md">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-blue-950">Official Academic Certificate Credential</h2>
              <p className="text-xs text-slate-500 font-mono">ID: {cert.cert_id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Verification Status:</span>
            {isRevoked ? (
              <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-black uppercase rounded-full flex items-center gap-1 border border-red-200">
                <ShieldAlert className="h-4 w-4" /> REVOKED CREDENTIAL
              </span>
            ) : (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black uppercase rounded-full flex items-center gap-1 border border-emerald-200">
                <ShieldCheck className="h-4 w-4" /> AUTHENTIC & VERIFIED
              </span>
            )}
          </div>
          {cert.issued_at && (
            <span className="text-xs text-slate-500 font-medium">
              Issued: {new Date(cert.issued_at).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Certificate Card Design Preview */}
        <div className="border-4 border-double border-blue-900/30 p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-blue-50/40 via-white to-slate-50 relative space-y-6 text-center shadow-inner">
          <div className="space-y-1">
            <div className="inline-block p-2 bg-blue-950 text-white rounded-xl mb-2">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-blue-950 uppercase tracking-wide">
              {cert.institution_name || "JNTUGV Constituent / Affiliated College"}
            </h3>
            <p className="text-xs text-slate-500 font-serif italic">State Technological University Certification Authority</p>
          </div>

          <div className="py-2 border-y border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">This certifies that candidate</p>
            <h4 className="text-2xl font-black text-slate-900 tracking-tight my-1">{cert.student_name}</h4>
            <p className="text-xs font-mono text-slate-600">Roll No: {cert.registration_number || cert.roll_number || "N/A"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500">has successfully completed all degree requirements for</p>
            <h5 className="text-lg font-extrabold text-blue-900">{cert.course_name}</h5>
            <p className="text-xs font-bold text-slate-700">Grade / Performance: <span className="text-emerald-700">{cert.grade}</span></p>
          </div>

          {/* Cryptographic Hashes Section */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-left text-xs font-mono space-y-1.5 break-all">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-sans font-bold uppercase border-b border-slate-100 pb-1 mb-1">
              <span>Cryptographic Proof</span>
              <span>SHA-256 Ledger State</span>
            </div>
            {cert.cert_hash && (
              <div>
                <span className="text-slate-400 font-sans">PDF Hash:</span>{" "}
                <span className="text-slate-700 font-semibold">{cert.cert_hash}</span>
              </div>
            )}
            {cert.ipfs_cid && (
              <div>
                <span className="text-slate-400 font-sans">IPFS CID:</span>{" "}
                <span className="text-blue-700 font-semibold">{cert.ipfs_cid}</span>
              </div>
            )}
            {cert.tx_hash && (
              <div>
                <span className="text-slate-400 font-sans">Tx Hash:</span>{" "}
                <span className="text-emerald-700 font-semibold">{cert.tx_hash}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {ipfsUrl ? (
            <a
              href={ipfsUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <ExternalLink className="h-4 w-4" /> Open IPFS Decentralized Copy
            </a>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
