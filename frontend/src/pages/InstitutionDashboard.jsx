import React, { useState, useEffect } from "react";
import { useAuth, API_BASE_URL } from "../context/AuthContext";
import { Award, FileText, CheckCircle, RefreshCw, AlertCircle, ShieldAlert, ShieldCheck, Download, Trash2, XCircle, Check, X, Landmark, GraduationCap } from "lucide-react";

export default function InstitutionDashboard() {
  const { authHeaders, user } = useAuth();
  
  const [activeTab, setActiveTab] = useState("pending-apps");

  // History State
  const [certificates, setCertificates] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [revokingId, setRevokingId] = useState(null);

  // Applications State
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appsError, setAppsError] = useState("");
  const [processingAppId, setProcessingAppId] = useState(null);

  // Fetch issued certificates
  const fetchCertificates = async () => {
    setLoadingHistory(true);
    setHistoryError("");
    try {
      const response = await fetch(`${API_BASE_URL}/institutions/certificates`, {
        headers: authHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load history");
      setCertificates(data);
    } catch (err) {
      setHistoryError(err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch pending applications
  const fetchApplications = async () => {
    setLoadingApps(true);
    setAppsError("");
    try {
      const response = await fetch(`${API_BASE_URL}/institutions/applications`, {
        headers: authHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load applications");
      setApplications(data);
    } catch (err) {
      setAppsError(err.message);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
    fetchApplications();
  }, []);

  // Approve student application
  const handleApproveApp = async (id, currentGrade, studentName) => {
    const newGrade = window.prompt(`Confirm or modify the grade/performance for ${studentName}:`, currentGrade);
    if (newGrade === null) return; // Cancelled

    setProcessingAppId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/institutions/applications/${id}/approve`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ grade: newGrade })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to approve application");

      alert("Application approved and forwarded to JNTUGV Admin for final issuance!");
      fetchApplications();
      fetchCertificates();
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setProcessingAppId(null);
    }
  };

  // Reject student application
  const handleRejectApp = async (id, studentName) => {
    if (!window.confirm(`Are you sure you want to reject the application from ${studentName}?`)) {
      return;
    }

    setProcessingAppId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/institutions/applications/${id}/reject`, {
        method: "POST",
        headers: authHeaders()
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to reject application");

      fetchApplications();
    } catch (err) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setProcessingAppId(null);
    }
  };

  // Submit Revocation
  const handleRevoke = async (certId) => {
    if (!window.confirm("ARE YOU SURE? Revoking a certificate is a permanent action on the blockchain ledger. Evaluators will see 'Status: Revoked'.")) {
      return;
    }

    setRevokingId(certId);
    try {
      const response = await fetch(`${API_BASE_URL}/institutions/certificates/${certId}/revoke`, {
        method: "POST",
        headers: authHeaders()
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to revoke certificate");

      fetchCertificates();
    } catch (err) {
      alert(`Revocation failed: ${err.message}`);
    } finally {
      setRevokingId(null);
    }
  };

  const getScanLink = (txHash) => {
    if (txHash.startsWith("0xmocktx")) {
      return "#";
    }
    return `https://amoy.polygonscan.com/tx/${txHash}`;
  };

  const getIpfsLink = (cid) => {
    if (cid.startsWith("QmMockIPFS")) {
      return `${API_BASE_URL}/verify/ipfs/${cid}`;
    }
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-brand-900 to-blue-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-brand-900/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-200 font-sans">Institution Control Room</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">{user.name}</h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Review and approve student certificate applications. Once approved, the requests will be forwarded to JNTUGV Admin for final cryptographic anchoring.
          </p>
        </div>
        <div className="flex flex-col text-sm bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-mono text-blue-100 shrink-0">
          <span className="text-xs font-bold text-blue-200 uppercase mb-1">Issuer Wallet</span>
          <span>{user.walletAddress.substring(0, 10)}...{user.walletAddress.substring(34)}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab("pending-apps")}
          className={`pb-4 px-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "pending-apps"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Pending Student Applications
          {applications.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
              {applications.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-4 px-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "history"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Award className="h-4 w-4" />
          Credential Registry Log
        </button>
      </div>

      {/* Tab: Pending Student Applications */}
      {activeTab === "pending-apps" && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-brand-900" />
              <h2 className="text-lg font-bold text-slate-800">Pending Requests</h2>
            </div>
            <button
              onClick={fetchApplications}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loadingApps ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 text-brand-900 animate-spin" />
            </div>
          ) : appsError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>{appsError}</span>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-semibold">No pending certificate requests</p>
              <p className="text-xs text-slate-400 mt-1">Student applications for your college will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-2">Student Name</th>
                    <th className="py-3 px-2">Course / Degree</th>
                    <th className="py-3 px-2">Roll Number</th>
                    <th className="py-3 px-2">Grade</th>
                    <th className="py-3 px-2">Applied On</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-2 font-semibold text-slate-900">{app.student_name}</td>
                      <td className="py-3.5 px-2 font-medium">{app.course_name}</td>
                      <td className="py-3.5 px-2 font-mono text-xs text-slate-600">{app.roll_number}</td>
                      <td className="py-3.5 px-2 font-semibold text-slate-600">{app.grade}</td>
                      <td className="py-3.5 px-2 text-xs text-slate-500">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApproveApp(app.id, app.grade, app.student_name)}
                            disabled={processingAppId !== null}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl border border-emerald-200 hover:border-emerald-600 transition disabled:opacity-50 flex items-center gap-1 text-xs font-semibold px-3"
                            title="Approve & Send to JNTUGV"
                          >
                            {processingAppId === app.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectApp(app.id, app.student_name)}
                            disabled={processingAppId !== null}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl border border-red-200 hover:border-red-600 transition disabled:opacity-50 flex items-center gap-1 text-xs font-semibold px-3"
                            title="Reject Request"
                          >
                            {processingAppId === app.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Credential Registry Log */}
      {activeTab === "history" && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Award className="h-6 w-6 text-brand-900" />
              <h2 className="text-lg font-bold text-slate-800">College Credential Registry</h2>
            </div>
            <button
              onClick={fetchCertificates}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loadingHistory ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 text-brand-900 animate-spin" />
            </div>
          ) : historyError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>{historyError}</span>
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Award className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-semibold">No certificates registered yet</p>
              <p className="text-xs text-slate-400 mt-1">Once JNTUGV Admin issues certificates for your approved requests, they will show up here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-2">Student</th>
                    <th className="py-3 px-2">Course</th>
                    <th className="py-3 px-2">Grade</th>
                    <th className="py-3 px-2">Proof Details</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                  {certificates.map((cert) => (
                    <tr key={cert.cert_id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-2">
                        <p className="font-semibold text-slate-900">{cert.student_name}</p>
                        <p className="text-xs text-slate-500">{cert.registration_number}</p>
                      </td>
                      <td className="py-3.5 px-2 font-medium">{cert.course_name}</td>
                      <td className="py-3.5 px-2 font-semibold text-slate-600">{cert.grade}</td>
                      <td className="py-3.5 px-2">
                        <div className="flex flex-col gap-0.5 text-xs font-mono">
                          <a
                             href={getScanLink(cert.tx_hash)}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-blue-600 hover:underline flex items-center gap-0.5 font-semibold"
                          >
                            TX: {cert.tx_hash.substring(0, 10)}...
                          </a>
                          <span className="text-slate-400">ID: {cert.cert_id.substring(0, 10)}...</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-2">
                        {cert.status === "revoked" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            <ShieldAlert className="h-3 w-3" />
                            Revoked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <a
                            href={getIpfsLink(cert.ipfs_cid)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-brand-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          {cert.status !== "revoked" && (
                            <button
                              onClick={() => handleRevoke(cert.cert_id)}
                              disabled={revokingId === cert.cert_id}
                              className="p-1.5 text-red-500 hover:text-white hover:bg-red-500 rounded-lg border border-red-200 hover:border-red-500 transition disabled:opacity-50"
                              title="Revoke Credential"
                            >
                              {revokingId === cert.cert_id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
