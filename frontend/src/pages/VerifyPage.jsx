import React, { useState } from "react";
import { FileUp, Search, ShieldCheck, ShieldAlert, Award, Calendar, Hash, ExternalLink, RefreshCw, Landmark } from "lucide-react";
import confetti from "canvas-confetti";
import { API_BASE_URL } from "../context/AuthContext";

export default function VerifyPage() {
  const [activeTab, setActiveTab] = useState("file"); // "file" or "id"
  const [certId, setCertId] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#1e3a8a", "#2563eb", "#3b82f6", "#10b981"]
    });
  };

  // Submit PDF File Verification
  const verifyFile = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("certificate", file);

    try {
      const response = await fetch(`${API_BASE_URL}/verify/upload`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setResult(data);
      if (data.isValid && !data.isRevoked) {
        triggerConfetti();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit ID Lookup Verification
  const verifyId = async (e) => {
    e.preventDefault();
    if (!certId.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/verify/${certId.trim()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Certificate not found");
      }

      // Check on-chain details
      const onChain = data.onChainDetails;
      // If we query by ID, it will return metadata if found in DB.
      // We simulate verification status: if it exists on-chain and isn't revoked, it is valid.
      const isValid = onChain && onChain.issuedAt > 0;
      setResult({
        certId: data.certId,
        isValid,
        isRevoked: onChain.revoked,
        onChainHash: onChain.certHash,
        onChainDetails: onChain,
        metadata: data.metadata
      });

      if (isValid && !onChain.revoked) {
        triggerConfetti();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetVerification = () => {
    setFile(null);
    setCertId("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Title Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-sans">
          Decentralized Credential <span className="bg-gradient-to-r from-brand-900 to-blue-600 bg-clip-text text-transparent">Verification</span>
        </h1>
        <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
          Verify academic degrees instantly and securely. Authenticate cryptographic document signatures anchored on the Polygon blockchain ledger.
        </p>
      </div>

      {/* Tabs Switcher */}
      {!result && (
        <div className="flex bg-slate-200/60 p-1.5 rounded-2xl max-w-md mx-auto mb-8">
          <button
            onClick={() => { setActiveTab("file"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === "file"
                ? "bg-white text-brand-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileUp className="h-4 w-4" />
            Upload PDF File
          </button>
          <button
            onClick={() => { setActiveTab("id"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === "id"
                ? "bg-white text-brand-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Search className="h-4 w-4" />
            Verify by ID
          </button>
        </div>
      )}

      {/* Forms Area */}
      {!result && (
        <div className="bg-white shadow-xl shadow-slate-100/50 border border-slate-200/50 rounded-3xl p-6 sm:p-8 animate-fade-in">
          {activeTab === "file" ? (
            <form onSubmit={verifyFile} className="space-y-6">
              {/* Drag and Drop Container */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer ${
                  dragActive 
                    ? "border-blue-500 bg-blue-50/50" 
                    : file 
                      ? "border-emerald-400 bg-emerald-50/10" 
                      : "border-slate-300 hover:border-slate-400 bg-slate-50/40"
                }`}
              >
                <input
                  type="file"
                  id="pdf-upload"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-4 rounded-full ${file ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                    <FileUp className="h-8 w-8" />
                  </div>
                  
                  {file ? (
                    <div>
                      <p className="text-base font-semibold text-slate-800">{file.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {(file.size / 1024).toFixed(1)} KB  |  Click or drag to replace
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-base font-semibold text-slate-800">
                        Drag and drop your certificate PDF here
                      </p>
                      <p className="text-xs text-slate-500 mt-1.5">
                        Supports PDF files up to 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-start gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!file || loading}
                className="w-full py-3.5 bg-gradient-to-r from-brand-900 to-blue-600 hover:shadow-lg disabled:opacity-50 text-white font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Running Cryptographic Check...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5" />
                    Run Integrity Audit
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyId} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Certificate Verification ID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Hash className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    value={certId}
                    onChange={(e) => setCertId(e.target.value)}
                    placeholder="Enter 0x-prefixed 32-byte Certificate ID..."
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150 font-mono"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-start gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!certId.trim() || loading}
                className="w-full py-3.5 bg-gradient-to-r from-brand-900 to-blue-600 hover:shadow-lg disabled:opacity-50 text-white font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Searching Blockchain Registry...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    Query Certificate
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Results View Card */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6 animate-slide-up">
          {/* Status Alert Badge */}
          {result.isRevoked ? (
            <div className="flex flex-col items-center text-center p-6 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-full mb-3">
                <ShieldAlert className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-extrabold text-amber-800">Credential officially revoked</h2>
              <p className="text-sm text-amber-700 mt-1 max-w-lg">
                This certificate was generated and secured on the blockchain registry, but has subsequently been officially revoked by the issuing institution.
              </p>
            </div>
          ) : result.isValid ? (
            <div className="flex flex-col items-center text-center p-6 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full mb-3">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-extrabold text-emerald-800">Certificate verified</h2>
              <p className="text-sm text-emerald-700 mt-1">
                Authentic academic credential. Secure digital signature matches the blockchain state record.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center p-6 bg-red-50 border border-red-200 rounded-2xl animate-pulse-slow">
              <div className="p-3 bg-red-100 text-red-700 rounded-full mb-3">
                <ShieldAlert className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-extrabold text-red-800">Verification Failure</h2>
              <p className="text-sm text-red-700 mt-1 max-w-lg font-medium">
                TAMPER WARNING: The uploaded PDF file contents do not hash to match the cryptographic signature registered on the blockchain. This indicates the file has been altered or forged.
              </p>
            </div>
          )}

          {/* Certificate Metadata Details */}
          {result.metadata ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
              {/* Institution and Student Details */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Landmark className="h-5 w-5 text-brand-900 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">College / Institution</p>
                    <p className="text-base font-semibold text-slate-800">{result.metadata.institutionName}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <UserIcon className="h-5 w-5 text-brand-900 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Student Name</p>
                    <p className="text-base font-semibold text-slate-800">{result.metadata.studentName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Roll/Reg No: <span className="font-semibold">{result.metadata.registrationNumber}</span></p>
                  </div>
                </div>
              </div>

              {/* Course details and Issue Time */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-brand-900 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Degree & Performance</p>
                    <p className="text-base font-semibold text-slate-800">{result.metadata.courseName}</p>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">Grade Awarded: <span className="text-blue-600 font-bold">{result.metadata.grade}</span></p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-brand-900 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Date & Time of Issue</p>
                    <p className="text-base font-semibold text-slate-800">
                      {result.onChainDetails?.issuedAt 
                        ? new Date(result.onChainDetails.issuedAt * 1000).toLocaleString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : "N/A"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-100 border rounded-2xl text-sm text-slate-600 text-center">
              Off-chain academic metadata details are unavailable. Reviewing on-chain raw credentials.
            </div>
          )}

          {/* Cryptographic Proof Details */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden text-sm">
            <div className="bg-slate-100 px-4 py-2 font-bold text-slate-700 flex items-center gap-1.5 border-b">
              <Hash className="h-4 w-4" />
              Cryptographic Audit Log
            </div>
            <div className="p-4 space-y-3 font-mono text-xs text-slate-600 break-all">
              <div>
                <span className="font-bold text-slate-800">Certificate ID:</span> {result.certId}
              </div>
              {result.uploadedHash && (
                <div>
                  <span className="font-bold text-slate-800">Computed File Hash:</span> {result.uploadedHash}
                </div>
              )}
              <div>
                <span className="font-bold text-slate-800">On-Chain Registry Hash:</span> {result.onChainHash}
              </div>
              {result.onChainDetails && (
                <>
                  <div>
                    <span className="font-bold text-slate-800">Smart Contract Issuer:</span> {result.onChainDetails.issuer}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Issued Timestamp:</span> {new Date(result.onChainDetails.issuedAt * 1000).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">IPFS CID Payload:</span> {result.onChainDetails.ipfsCID}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Links */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {result.onChainDetails?.ipfsCID && (
              <a
                href={result.onChainDetails.ipfsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 bg-slate-100 text-slate-800 font-semibold rounded-2xl hover:bg-slate-200 transition duration-150 flex items-center justify-center gap-2 border border-slate-300/50"
              >
                <ExternalLink className="h-4 w-4" />
                View Original PDF
              </a>
            )}
            <button
              onClick={resetVerification}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-brand-900 to-blue-600 text-white font-semibold rounded-2xl hover:shadow-lg transition duration-150"
            >
              Verify Another Certificate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline student icon for layout
function UserIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}
