import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, API_BASE_URL } from "../context/AuthContext";
import { Shield, RefreshCw, AlertCircle, Check, X, Landmark, ShieldCheck, ShieldAlert, Mail, FileText, Award, GraduationCap, Trash2, Clock, ExternalLink, Search, ArrowUpDown, Eye } from "lucide-react";
import ExportReportModal from "../components/ExportReportModal";
import RevokeCertificateModal from "../components/RevokeCertificateModal";
import ViewCertificateModal from "../components/ViewCertificateModal";

export default function AdminDashboard() {
  const { authHeaders } = useAuth();
  
  const [activeTab, setActiveTab] = useState("certificates");
  const [exportOpen, setExportOpen] = useState(false);

  // Institutions State
  const [institutions, setInstitutions] = useState([]);
  const [loadingInst, setLoadingInst] = useState(true);
  const [instError, setInstError] = useState("");
  const [processingInstId, setProcessingInstId] = useState(null);

  // E-Certificate Applications State
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appsError, setAppsError] = useState("");
  const [processingAppId, setProcessingAppId] = useState(null);

  // Issued Certificates State
  const [issuedCertificates, setIssuedCertificates] = useState([]);
  const [loadingIssued, setLoadingIssued] = useState(false);
  const [issuedError, setIssuedError] = useState("");
  const [issuedSort, setIssuedSort] = useState("desc");
  const [issuedSearch, setIssuedSearch] = useState("");
  const [revokeCertId, setRevokeCertId] = useState(null);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const fetchInstitutions = async () => {
    setLoadingInst(true);
    setInstError("");
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institutions`, {
        headers: authHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load institutions");
      setInstitutions(data);
    } catch (err) {
      setInstError(err.message);
    } finally {
      setLoadingInst(false);
    }
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    setAppsError("");
    try {
      const response = await fetch(`${API_BASE_URL}/admin/applications/pending`, {
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

  const fetchIssuedCertificates = async (overrideSort = issuedSort, overrideSearch = issuedSearch) => {
    setLoadingIssued(true);
    setIssuedError("");
    try {
      const response = await fetch(`${API_BASE_URL}/admin/certificates/issued?sort=${overrideSort}&search=${encodeURIComponent(overrideSearch)}`, {
        headers: authHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load issued certificates");
      setIssuedCertificates(Array.isArray(data) ? data : []);
    } catch (err) {
      setIssuedError(err.message);
    } finally {
      setLoadingIssued(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
    fetchApplications();
    fetchIssuedCertificates();
  }, []);

  const handleApproveInst = async (id, name) => {
    if (!window.confirm(`Approve registration for ${name}? This will execute a transaction to whitelist their wallet address on the smart contract.`)) {
      return;
    }

    setProcessingInstId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institutions/${id}/approve`, {
        method: "POST",
        headers: authHeaders()
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to approve institution");

      alert(`Institution approved! Transaction Hash: ${data.txHash}`);
      fetchInstitutions();
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setProcessingInstId(null);
    }
  };

  const handleRejectInst = async (id, name) => {
    if (!window.confirm(`Reject registration for ${name}?`)) {
      return;
    }

    setProcessingInstId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institutions/${id}/reject`, {
        method: "POST",
        headers: authHeaders()
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to reject institution");

      fetchInstitutions();
    } catch (err) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setProcessingInstId(null);
    }
  };

  const handleRemoveInst = async (id, name) => {
    if (!window.confirm(`Remove institution "${name}"? This will delete the record and deauthorize its wallet address on-chain if active.`)) {
      return;
    }

    setProcessingInstId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institutions/${id}`, {
        method: "DELETE",
        headers: authHeaders()
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to remove institution");

      alert(`Institution "${name}" removed successfully.`);
      fetchInstitutions();
    } catch (err) {
      alert(`Removal failed: ${err.message}`);
    } finally {
      setProcessingInstId(null);
    }
  };

  const handleApproveApp = async (id, studentName, courseName) => {
    if (!window.confirm(`Approve e-certificate request for ${studentName} (${courseName})? This will cryptographically sign the credential on Polygon.`)) {
      return;
    }

    setProcessingAppId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/applications/${id}/approve`, {
        method: "POST",
        headers: authHeaders()
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to issue certificate");

      alert(`E-Certificate generated successfully!\nBlockchain Transaction: ${data.txHash}`);
      fetchApplications();
    } catch (err) {
      alert(`Certificate generation failed: ${err.message}`);
    } finally {
      setProcessingAppId(null);
    }
  };

  const handleRejectApp = async (id, studentName) => {
    if (!window.confirm(`Reject the certificate application from ${studentName}?`)) {
      return;
    }

    setProcessingAppId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/applications/${id}/reject`, {
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 to-blue-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-brand-900/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-200">System Admin Control Center (JNTUGV)</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">JNTUGV Admin Dashboard</h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            As the apex university authority (JNTUGV), whitelist affiliated colleges and conduct the final cryptographic review of student e-certificate requests.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab("certificates")}
          className={`pb-4 px-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "certificates"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Award className="h-4 w-4" />
          E-Certificate Approvals
          {applications.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
              {applications.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("colleges")}
          className={`pb-4 px-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "colleges"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Landmark className="h-4 w-4" />
          Institution Authorizations
        </button>

        <button
          onClick={() => { setActiveTab("issued"); fetchIssuedCertificates(); }}
          className={`pb-4 px-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "issued"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Check className="h-4 w-4 text-emerald-600" />
          Issued Certificates ({issuedCertificates.length})
        </button>

        <div className="ml-auto flex items-center gap-2 pb-4">
          <Link
            to="/admin/analytics"
            className="px-3 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition"
          >
            📊 Analytics
          </Link>
          <Link
            to="/admin/audit-logs"
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition"
          >
            🛡️ Audit Logs
          </Link>
          <button
            onClick={() => setExportOpen(true)}
            className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition"
          >
            📥 Export Reports
          </button>
        </div>
      </div>

      {/* Tab: E-Certificate Approvals */}
      {activeTab === "certificates" && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-brand-900" />
              <h2 className="text-lg font-bold text-slate-800">Pending JNTUGV Certificate Issuances</h2>
            </div>
            <button
              onClick={fetchApplications}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loadingApps ? (
            <div className="flex justify-center items-center py-16">
              <RefreshCw className="h-10 w-10 text-brand-900 animate-spin" />
            </div>
          ) : appsError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>{appsError}</span>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-semibold">No pending certificate approvals</p>
              <p className="text-xs text-slate-400 mt-1">Applications approved by colleges will appear here for final issuance.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-2">Student Details</th>
                    <th className="py-3 px-2">Affiliated College</th>
                    <th className="py-3 px-2">Course / Degree</th>
                    <th className="py-3 px-2">Grade</th>
                    <th className="py-3 px-2">Approved By College On</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-2">
                        <p className="font-semibold text-slate-900">{app.student_name}</p>
                        <p className="text-xs text-slate-500 font-mono">Roll: {app.registration_number}</p>
                      </td>
                      <td className="py-4 px-2 font-medium text-slate-600">{app.institution_name}</td>
                      <td className="py-4 px-2 font-semibold text-slate-800">{app.course_name}</td>
                      <td className="py-4 px-2 font-bold text-slate-600">{app.grade}</td>
                      <td className="py-4 px-2 text-xs text-slate-500">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApproveApp(app.id, app.student_name, app.course_name)}
                            disabled={processingAppId !== null}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl border border-emerald-200 hover:border-emerald-600 transition disabled:opacity-50 flex items-center gap-1 text-xs font-semibold px-3 py-2"
                            title="Approve & Generate E-Certificate on Polygon"
                          >
                            {processingAppId === app.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Issue Certificate
                          </button>
                          <button
                            onClick={() => handleRejectApp(app.id, app.student_name)}
                            disabled={processingAppId !== null}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl border border-red-200 hover:border-red-600 transition disabled:opacity-50 flex items-center gap-1 text-xs font-semibold px-3 py-2"
                            title="Reject Application"
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

      {/* Tab: Institution Authorizations */}
      {activeTab === "colleges" && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Landmark className="h-6 w-6 text-brand-900" />
              <h2 className="text-lg font-bold text-slate-800">Affiliated College Whitelist</h2>
            </div>
            <button
              onClick={fetchInstitutions}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loadingInst ? (
            <div className="flex justify-center items-center py-16">
              <RefreshCw className="h-10 w-10 text-brand-900 animate-spin" />
            </div>
          ) : instError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>{instError}</span>
            </div>
          ) : institutions.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Landmark className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-semibold">No institutions registered in database</p>
              <p className="text-xs text-slate-400 mt-1">Institutional signup submissions will display here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-2">Institution Details</th>
                    <th className="py-3 px-2">Wallet Address</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Registered On</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                  {institutions.map((inst) => (
                    <tr key={inst.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-slate-100 text-slate-500 rounded-xl">
                            <Landmark className="h-4 w-4" />
                          </div>
                          <span className="font-semibold text-slate-900">{inst.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 font-mono text-xs text-slate-600 break-all">{inst.wallet_address}</td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>{inst.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-xs text-slate-500">
                        {new Date(inst.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-2">
                        {inst.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="h-3 w-3" />
                            Approved
                          </span>
                        ) : inst.status === "rejected" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            <ShieldAlert className="h-3 w-3" />
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <RefreshCw className="h-3 w-3 animate-pulse" />
                            Pending Review
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div className="flex justify-end gap-2">
                          {inst.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApproveInst(inst.id, inst.name)}
                                disabled={processingInstId !== null}
                                className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl border border-emerald-200 hover:border-emerald-600 transition disabled:opacity-50"
                                title="Approve & Whitelist Wallet Address"
                              >
                                {processingInstId === inst.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleRejectInst(inst.id, inst.name)}
                                disabled={processingInstId !== null}
                                className="p-1.5 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white rounded-xl border border-orange-200 hover:border-orange-600 transition disabled:opacity-50"
                                title="Reject"
                              >
                                {processingInstId === inst.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleRemoveInst(inst.id, inst.name)}
                            disabled={processingInstId !== null}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl border border-red-200 hover:border-red-600 transition disabled:opacity-50 flex items-center gap-1 text-xs font-semibold px-2.5"
                            title="Remove / Delete College"
                          >
                            {processingInstId === inst.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Remove
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

      {/* Tab: Issued Certificates */}
      {activeTab === "issued" && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Check className="h-6 w-6 text-emerald-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-800">All Issued Certificates Database</h2>
                <p className="text-xs text-slate-500">Real-time database records sorted by issuance date</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={issuedSearch}
                  onChange={(e) => { setIssuedSearch(e.target.value); fetchIssuedCertificates(issuedSort, e.target.value); }}
                  placeholder="Search candidate, roll, course..."
                  className="w-full text-xs border border-slate-200 rounded-xl pl-9 p-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <button
                onClick={() => {
                  const newSort = issuedSort === "desc" ? "asc" : "desc";
                  setIssuedSort(newSort);
                  fetchIssuedCertificates(newSort, issuedSearch);
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 flex items-center gap-1.5 shrink-0"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                Sort: {issuedSort === "desc" ? "Newest First" : "Oldest First"}
              </button>

              <button
                onClick={() => fetchIssuedCertificates(issuedSort, issuedSearch)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl border border-slate-200 transition shrink-0"
                title="Refresh Table"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {loadingIssued ? (
            <div className="flex justify-center items-center py-16">
              <RefreshCw className="h-10 w-10 text-brand-900 animate-spin" />
            </div>
          ) : issuedError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>{issuedError}</span>
            </div>
          ) : issuedCertificates.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Award className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-semibold">No issued certificates found</p>
              <p className="text-xs text-slate-400 mt-1">Certificates issued by colleges or admin will display here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-2">Certificate ID / Hash</th>
                    <th className="py-3 px-2">Candidate Details</th>
                    <th className="py-3 px-2">Course & Grade</th>
                    <th className="py-3 px-2">Issuing College</th>
                    <th className="py-3 px-2">Issue Date & Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                  {issuedCertificates.map((cert) => (
                    <tr key={cert.cert_id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-2">
                        <Link to={`/timeline/${cert.cert_id}`} className="font-mono text-xs font-bold text-blue-600 hover:underline">
                          {cert.cert_id.substring(0, 14)}...
                        </Link>
                        {cert.ipfs_cid && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            IPFS: {cert.ipfs_cid.substring(0, 10)}...
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-2">
                        <p className="font-semibold text-slate-900">{cert.student_name}</p>
                        <p className="text-xs text-slate-500 font-mono">Roll: {cert.registration_number || "N/A"}</p>
                      </td>
                      <td className="py-4 px-2">
                        <p className="font-semibold text-slate-800">{cert.course_name}</p>
                        <p className="text-xs font-bold text-slate-600">{cert.grade}</p>
                      </td>
                      <td className="py-4 px-2 font-medium text-slate-600">
                        {cert.institution_name || "JNTUGV Constituent College"}
                      </td>
                      <td className="py-4 px-2">
                        <div className="text-xs text-slate-500">
                          {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : "Issued"}
                        </div>
                        {cert.status === "revoked" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-red-800 mt-1">
                            <ShieldAlert className="h-3 w-3" /> Revoked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 mt-1">
                            <ShieldCheck className="h-3 w-3" /> Authentic
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setSelectedCert(cert); setViewModalOpen(true); }}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-700 hover:text-white rounded-xl border border-emerald-200 transition text-xs font-semibold px-2.5 flex items-center gap-1"
                            title="View Certificate Details"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Certificate
                          </button>
                          <Link
                            to={`/timeline/${cert.cert_id}`}
                            className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-700 hover:text-white rounded-xl border border-blue-200 transition text-xs font-semibold px-2.5 flex items-center gap-1"
                            title="View Lifecycle Timeline"
                          >
                            <Clock className="h-3.5 w-3.5" /> Timeline
                          </Link>
                          {cert.status !== "revoked" && (
                            <button
                              onClick={() => { setRevokeCertId(cert.cert_id); setRevokeModalOpen(true); }}
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl border border-red-200 transition text-xs font-semibold px-2.5 flex items-center gap-1"
                              title="Revoke Certificate"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" /> Revoke
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

      <ViewCertificateModal
        cert={selectedCert}
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
      />

      <RevokeCertificateModal
        certId={revokeCertId}
        isOpen={revokeModalOpen}
        onClose={() => setRevokeModalOpen(false)}
        onSuccess={() => fetchIssuedCertificates()}
      />

      <ExportReportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
