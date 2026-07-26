import React, { useState, useEffect } from "react";
import { useAuth, API_BASE_URL } from "../context/AuthContext";
import { Award, Download, Share2, Clipboard, RefreshCw, AlertCircle, ShieldCheck, ShieldAlert, BookOpen, Calendar, Landmark, FileText, Send, ChevronRight } from "lucide-react";

export default function StudentPortal() {
  const { authHeaders, user, token } = useAuth();
  
  const [activeTab, setActiveTab] = useState("my-certificates");

  // Certificates State
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // Applications State
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [applicationsError, setApplicationsError] = useState("");

  // Apply Form State
  const [colleges, setColleges] = useState([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState("");
  const [rollNumber, setRollNumber] = useState(user.registrationNumber || "");
  const [courseName, setCourseName] = useState("");
  const [grade, setGrade] = useState("");
  const [studentPhoto, setStudentPhoto] = useState(null);
  const [submittingApp, setSubmittingApp] = useState(false);
  const [appError, setAppError] = useState("");
  const [appSuccess, setAppSuccess] = useState("");

  const fetchCertificates = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/students/certificates`, {
        headers: authHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load certificates");
      setCertificates(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoadingApplications(true);
    setApplicationsError("");
    try {
      const response = await fetch(`${API_BASE_URL}/students/certificates/applications`, {
        headers: authHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load applications");
      setApplications(data);
    } catch (err) {
      setApplicationsError(err.message);
    } finally {
      setLoadingApplications(false);
    }
  };

  const fetchColleges = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/students/institutions`, {
        headers: authHeaders()
      });
      const data = await response.json();
      if (response.ok) setColleges(data);
    } catch (err) {
      console.error("Failed to load colleges:", err);
    }
  };

  useEffect(() => {
    fetchCertificates();
    fetchColleges();
    fetchApplications();
  }, []);

  const handleShare = (certId) => {
    const url = `${window.location.origin}/verify-by-id?id=${certId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(certId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getIpfsLink = (cid) => {
    if (cid.startsWith("QmMockIPFS")) {
      return `${API_BASE_URL}/verify/ipfs/${cid}`;
    }
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedCollegeId || !rollNumber || !courseName || !grade || !studentPhoto) {
      return setAppError("Please fill out all required fields and upload your photo.");
    }

    setSubmittingApp(true);
    setAppError("");
    setAppSuccess("");

    try {
      const formData = new FormData();
      formData.append("institutionId", selectedCollegeId);
      formData.append("rollNumber", rollNumber);
      formData.append("courseName", courseName);
      formData.append("grade", grade);
      formData.append("studentPhoto", studentPhoto);

      const response = await fetch(`${API_BASE_URL}/students/certificates/apply`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
          // Note: Do NOT set Content-Type header when using FormData; the browser will set it with the correct boundary!
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Application failed.");

      setAppSuccess("Your certificate application has been submitted successfully to the college!");
      setSelectedCollegeId("");
      setCourseName("");
      setGrade("");
      setStudentPhoto(null);
      
      // Reset the file input element in form
      e.target.reset();
      
      // Refresh applications list
      fetchApplications();
    } catch (err) {
      setAppError(err.message);
    } finally {
      setSubmittingApp(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending_college":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Pending College
          </span>
        );
      case "approved_by_college":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Pending JNTUGV
          </span>
        );
      case "rejected_by_college":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            Rejected by College
          </span>
        );
      case "approved_by_admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Issued by JNTUGV
          </span>
        );
      case "rejected_by_admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            Rejected by JNTUGV
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-brand-900 to-blue-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-brand-900/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Student Wallet Portal</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">{user.name}</h1>
          <p className="text-blue-100 text-sm mt-1">
            Registered Student ID: <span className="font-mono font-bold">{user.registrationNumber}</span>
          </p>
        </div>
        <div className="flex flex-col text-sm bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-mono text-blue-100 shrink-0">
          <span className="text-xs font-bold text-blue-200 uppercase mb-1">Email Address</span>
          <span>{user.email}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab("my-certificates")}
          className={`pb-4 px-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "my-certificates"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Award className="h-4 w-4" />
          My Verified Credentials
        </button>
        <button
          onClick={() => setActiveTab("apply")}
          className={`pb-4 px-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "apply"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="h-4 w-4" />
          Apply for Certificate
        </button>
      </div>

      {/* Tab: My Certificates */}
      {activeTab === "my-certificates" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Award className="h-6 w-6 text-brand-900" />
              Verified Credentials
            </h2>
            <button
              onClick={fetchCertificates}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <RefreshCw className="h-10 w-10 text-brand-900 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>{error}</span>
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl p-8">
              <Award className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800">No Certificates Found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1.5">
                Go to the **Apply for Certificate** tab to request an e-certificate from your college.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => (
                <div
                  key={cert.cert_id}
                  className="bg-white border border-slate-200/85 rounded-3xl shadow-lg hover:shadow-xl hover:border-slate-300/80 transition-all duration-200 overflow-hidden flex flex-col justify-between"
                >
                  <div className={`h-2 w-full ${cert.status === 'revoked' ? 'bg-red-500' : 'bg-gradient-to-r from-brand-900 to-blue-600'}`}></div>
                  
                  <div className="p-6 space-y-4 flex-1">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono text-slate-400">
                        ID: {cert.cert_id.substring(0, 10)}...
                      </span>
                      {cert.status === "revoked" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          <ShieldAlert className="h-3 w-3" />
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-lg font-extrabold text-slate-900 line-clamp-1">{cert.course_name}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Landmark className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{cert.institution_name}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-slate-100 py-3 bg-slate-50/50 rounded-xl px-3">
                      <div className="flex items-center gap-1 text-slate-500">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Grade: <span className="font-bold text-slate-800">{cert.grade}</span></span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Issued: <span className="font-bold text-slate-800">{new Date(cert.issued_at).toLocaleDateString()}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex gap-3">
                    <a
                      href={getIpfsLink(cert.ipfs_cid)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-3 bg-white text-slate-700 font-semibold text-xs border border-slate-200 hover:bg-slate-100 rounded-xl transition duration-150 flex items-center justify-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                    <button
                      onClick={() => handleShare(cert.cert_id)}
                      className="flex-1 py-2.5 px-3 bg-brand-900 text-white font-semibold text-xs rounded-xl hover:bg-brand-700 transition duration-150 flex items-center justify-center gap-1.5"
                    >
                      {copiedId === cert.cert_id ? (
                        <>
                          <Clipboard className="h-3.5 w-3.5" />
                          Copied Link!
                        </>
                      ) : (
                        <>
                          <Share2 className="h-3.5 w-3.5" />
                          Share Proof
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Apply for Certificate */}
      {activeTab === "apply" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Application Form */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-6 sm:p-8 h-fit lg:col-span-1 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">Apply for E-Certificate</h2>
            </div>

            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Select JNTUGV Constituent or Associate College</label>
                <select
                  required
                  value={selectedCollegeId}
                  onChange={(e) => setSelectedCollegeId(e.target.value)}
                  className="mt-1 w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                >
                  <option value="">-- Select JNTUGV Constituent / Affiliated Associate College --</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Roll Number / Reg No</label>
                <input
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. REG2026042"
                  className="mt-1 w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Course / Degree Program</label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science"
                  className="mt-1 w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Expected Grade / CGPA</label>
                <input
                  type="text"
                  required
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g. A+ or 8.9 CGPA"
                  className="mt-1 w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Student Profile Photo (Image)</label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={(e) => setStudentPhoto(e.target.files[0])}
                  className="mt-1 w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-150"
                />
              </div>

              {appError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{appError}</span>
                </div>
              )}

              {appSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{appSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submittingApp}
                className="w-full py-3.5 bg-gradient-to-r from-brand-900 to-blue-600 hover:shadow-lg disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2"
              >
                {submittingApp ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Apply for E-Certificate
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Applications Log */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-6 sm:p-8 lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-brand-900" />
                <h2 className="text-lg font-bold text-slate-800">Application History</h2>
              </div>
              <button
                onClick={fetchApplications}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {loadingApplications ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="h-8 w-8 text-brand-900 animate-spin" />
              </div>
            ) : applicationsError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span>{applicationsError}</span>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-semibold">No applications yet</p>
                <p className="text-xs text-slate-400 mt-1">Submit the form to request your first e-certificate.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-2">College</th>
                      <th className="py-3 px-2">Course</th>
                      <th className="py-3 px-2">Roll Number</th>
                      <th className="py-3 px-2">Grade</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right">Applied On</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-2 font-semibold text-slate-900">{app.institution_name}</td>
                        <td className="py-3.5 px-2 font-medium">{app.course_name}</td>
                        <td className="py-3.5 px-2 font-mono text-xs">{app.roll_number}</td>
                        <td className="py-3.5 px-2 font-semibold text-slate-600">{app.grade}</td>
                        <td className="py-3.5 px-2">{getStatusBadge(app.status)}</td>
                        <td className="py-3.5 px-2 text-right text-xs text-slate-500">
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
