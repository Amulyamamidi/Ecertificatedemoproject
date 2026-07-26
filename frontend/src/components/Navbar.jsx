import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shield, LogOut, CheckCircle, Award, User, Home } from "lucide-react";

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin, isInstitution, isStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-150 ${
      isActive(path)
        ? "bg-white/15 text-white shadow-sm"
        : "text-blue-100 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <header className="w-full bg-white select-none">
      {/* 1. Official JNTU-GV University Header Banner */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-center sm:justify-start gap-4 md:gap-6">
          <img
            src="/jntugv_logo.png"
            alt="JNTU-GV Logo"
            className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 object-contain shrink-0"
          />
          <div className="text-center sm:text-left flex flex-col justify-center">
            <h1 className="text-xs sm:text-sm md:text-lg lg:text-2xl font-extrabold tracking-tight text-blue-900 uppercase font-sans leading-tight">
              Jawaharlal Nehru Technological University Gurajada Vizianagaram
            </h1>
            <p className="text-[9px] text-center sm:text-xs md:text-sm font-semibold text-slate-700 tracking-wide mt-1">
              VIZIANAGARAM-535 003, A.P
            </p>
            <p className="text-[8px] text-center sm:text-xs text-slate-500 font-medium tracking-wide mt-0.5">
              (Established by Andhra Pradesh Act No.22 of 2021)
            </p>
          </div>
        </div>
      </div>

      {/* 2. Sticky Menu Navigation Bar (Dark Navy Theme) */}
      <nav className="sticky top-0 z-50 bg-[#0d2358] border-b border-blue-950 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            {/* Menu Links */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 text-white select-none">
                <span className="font-black text-xs uppercase tracking-widest text-white border-r border-blue-800 pr-3 mr-2 font-sans">
                  Home
                </span>
              </Link>

              <div className="flex space-x-1">
                <Link to="/" className={linkClass("/")}>
                  <Home className="h-4 w-4 text-blue-200" />
                  Verify Certificate
                </Link>

                {isAuthenticated && isInstitution && (
                  <Link to="/institution" className={linkClass("/institution")}>
                    <Award className="h-4 w-4 text-blue-200" />
                    University Portal
                  </Link>
                )}

                {isAuthenticated && isStudent && (
                  <Link to="/student" className={linkClass("/student")}>
                    <User className="h-4 w-4 text-blue-200" />
                    Student Portal
                  </Link>
                )}

                {isAuthenticated && isAdmin && (
                  <Link to="/admin" className={linkClass("/admin")}>
                    <Shield className="h-4 w-4 text-blue-200" />
                    Admin Dashboard
                  </Link>
                )}
              </div>
            </div>

            {/* User Session status */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  {/* Profile Badge */}
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest leading-none">
                      {user.role}
                    </span>
                    <span className="text-xs font-semibold text-white mt-0.5">
                      {user.name}
                    </span>
                  </div>

                  <div className="h-8 w-px bg-blue-800 hidden md:block"></div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-200 bg-red-950/40 hover:bg-red-900/40 rounded-xl border border-red-800/30 active:scale-95 transition-all duration-150"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 text-xs font-semibold text-blue-100 hover:bg-white/10 rounded-xl transition-all duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 text-xs font-semibold text-blue-900 bg-white hover:bg-blue-50 hover:shadow-lg rounded-xl active:scale-95 transition-all duration-150"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
