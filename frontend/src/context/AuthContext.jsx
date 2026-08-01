import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext(null);

const rawApiUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/v1").trim();
let normalizedUrl = rawApiUrl;
if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
  normalizedUrl = `https://${normalizedUrl}`;
}
try {
  const parsed = new URL(normalizedUrl);
  if (!parsed.hostname.includes(".") && parsed.hostname !== "localhost") {
    parsed.hostname = `${parsed.hostname}.onrender.com`;
    normalizedUrl = parsed.toString();
  }
} catch (e) {}

normalizedUrl = normalizedUrl.replace(/\/+$/, "");
if (!normalizedUrl.endsWith("/v1")) {
  normalizedUrl = `${normalizedUrl}/v1`;
}
export const API_BASE_URL = normalizedUrl;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from local storage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("cert_shield_token");
    const savedUser = localStorage.getItem("cert_shield_user");
    
    if (savedToken && savedUser && savedUser !== "undefined" && savedUser !== "null") {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser) {
          setToken(savedToken);
          setUser(parsedUser);
        }
      } catch (err) {
        console.warn("[AuthContext] Invalid saved user data in localStorage, clearing auth session.");
        localStorage.removeItem("cert_shield_token");
        localStorage.removeItem("cert_shield_user");
      }
    }
    setLoading(false);
  }, []);

  /**
   * Log in a user (student, institution, or admin)
   * @param {string} email 
   * @param {string} password 
   * @param {'student' | 'institution' | 'admin'} type 
   */
  const login = async (email, password, type) => {
    let endpoint = "";
    if (type === "student") {
      endpoint = `${API_BASE_URL}/auth/student/login`;
    } else if (type === "institution") {
      endpoint = `${API_BASE_URL}/auth/institution/login`;
    } else if (type === "admin") {
      endpoint = `${API_BASE_URL}/auth/admin/login`;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    let data = {};
    const text = await response.text();
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = { error: `Server connection error (${response.status}). Please try again.` };
    }

    if (!response.ok) {
      const err = new Error(data.error || "Login failed");
      err.needsVerification = data.needsVerification;
      err.email = data.email;
      err.role = data.role;
      throw err;
    }

    localStorage.setItem("cert_shield_token", data.token);
    localStorage.setItem("cert_shield_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    
    return data.user;
  };

  /**
   * Registers a new user/institution
   */
  const register = async (userData, type) => {
    const endpoint = type === "student"
      ? `${API_BASE_URL}/auth/student/register`
      : `${API_BASE_URL}/auth/institution/register`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(userData)
    });

    let data = {};
    const text = await response.text();
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = { error: `Server connection error (${response.status}). Please try again.` };
    }

    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }

    return data;
  };

  const logout = () => {
    localStorage.removeItem("cert_shield_token");
    localStorage.removeItem("cert_shield_user");
    setToken(null);
    setUser(null);
  };

  // Helper getters
  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    isStudent: user?.role === "student",
    isInstitution: user?.role === "institution",
    isAdmin: user?.role === "admin",
    login,
    register,
    logout,
    // Add auth headers helper
    authHeaders: () => ({
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    })
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
