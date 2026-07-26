import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext(null);

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/v1";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from local storage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("cert_shield_token");
    const savedUser = localStorage.getItem("cert_shield_user");
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
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

    const data = await response.json();

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

    const data = await response.json();

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
