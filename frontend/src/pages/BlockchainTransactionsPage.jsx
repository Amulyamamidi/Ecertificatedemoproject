import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Search, ExternalLink, Cpu, CheckCircle } from "lucide-react";
import { API_BASE_URL } from "../context/AuthContext";

export default function BlockchainTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const baseUrl = API_BASE_URL.replace(/\/v1$/, "");

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/transactions?search=${search}`);
      const data = await res.json();
      if (data.transactions) setTransactions(data.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div className="py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-blue-950 flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-indigo-600" /> Blockchain Transaction History Explorer
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Public ledger audit log showing smart contract calls, block hashes, gas metrics, and certificate states.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchTransactions()}
          placeholder="Search Tx Hash, Certificate ID, or Wallet Address..."
          className="w-full text-xs border-none focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Tx Hash</th>
                <th className="p-4">Action</th>
                <th className="p-4">Linked Certificate ID</th>
                <th className="p-4">Gas Used</th>
                <th className="p-4">Status</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                    Loading blockchain transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                    No transactions recorded on-chain yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition font-mono">
                    <td className="p-4 text-blue-600 font-bold">
                      <a
                        href={`https://amoy.polygonscan.com/tx/${tx.tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline flex items-center gap-1"
                      >
                        {tx.tx_hash.substring(0, 14)}... <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="p-4 font-sans font-bold">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${
                        tx.action_type === "REVOKE" ? "bg-red-50 text-red-700" : "bg-indigo-50 text-indigo-700"
                      }`}>
                        {tx.action_type}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 font-sans">
                      {tx.cert_id ? (
                        <Link to={`/timeline/${tx.cert_id}`} className="text-blue-600 hover:underline font-mono">
                          {tx.cert_id.substring(0, 12)}...
                        </Link>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 font-sans">{tx.gas_used || "21000"} units</td>
                    <td className="p-4 font-sans">
                      <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                        <CheckCircle className="h-3.5 w-3.5" /> SUCCESS
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-sans text-[10px]">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
