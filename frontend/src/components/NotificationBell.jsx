import React, { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { API_BASE_URL } from "../context/AuthContext";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const baseUrl = API_BASE_URL.replace(/\/v1$/, "");

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("cert_shield_token") || localStorage.getItem("certishield_token");
      if (!token) return;
      const res = await fetch(`${baseUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem("cert_shield_token") || localStorage.getItem("certishield_token");
      await fetch(`${baseUrl}/api/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(0);
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch (err) {}
  };

  return (
    <div className="relative select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-xl transition"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 text-slate-800">
          <div className="flex items-center justify-between p-3 border-b border-slate-100">
            <span className="font-bold text-xs text-blue-950 uppercase tracking-wider">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No notifications yet</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-3 text-xs ${n.is_read ? "bg-white" : "bg-blue-50/50 font-medium"}`}>
                  <div className="font-semibold text-slate-800">{n.title}</div>
                  <div className="text-slate-600 mt-0.5">{n.message}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleTimeString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
