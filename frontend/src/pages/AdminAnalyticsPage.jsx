import React, { useState, useEffect } from "react";
import { BarChart3, Award, ShieldAlert, CheckCircle, Activity, FileText, TrendingUp } from "lucide-react";
import { API_BASE_URL } from "../context/AuthContext";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("cert_shield_token") || localStorage.getItem("certishield_token");
    const baseUrl = API_BASE_URL.replace(/\/v1$/, "");
    fetch(`${baseUrl}/api/analytics/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.summary) setData(resData.summary);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading analytics dashboard...</div>;
  }

  return (
    <div className="py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-blue-950 flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-blue-700" /> University Admin Analytics & Metrics
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          High-level metrics for total certificate issuances, verifications, revocations, and transaction volume.
        </p>
      </div>

      {/* KPI Card Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Issued</span>
            <h3 className="text-2xl font-black text-slate-800">{data?.totalIssued || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Verified</span>
            <h3 className="text-2xl font-black text-slate-800">{data?.totalVerifications || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-700 rounded-xl">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Revoked Credentials</span>
            <h3 className="text-2xl font-black text-slate-800">{data?.totalRevoked || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Blockchain Transactions</span>
            <h3 className="text-2xl font-black text-slate-800">{data?.totalTransactions || 0}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Issuance Visual Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" /> Monthly Certificate Issuance Trend
          </h3>
          <div className="space-y-3 pt-2">
            {(data?.monthlyIssuance || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No monthly trend data recorded yet.</p>
            ) : (
              data.monthlyIssuance.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{item.month}</span>
                    <span>{item.count} Issued</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${Math.min(100, (parseInt(item.count) / Math.max(1, data.totalIssued)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Audit Activity Stream */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-600" /> Recent Security Stream
          </h3>
          <div className="space-y-3 divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {(data?.recentActivities || []).map((act, idx) => (
              <div key={idx} className="pt-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="text-blue-900">{act.action}</span>
                  <span className="text-[10px] text-slate-400">{new Date(act.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-500 mt-0.5 truncate">{act.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
