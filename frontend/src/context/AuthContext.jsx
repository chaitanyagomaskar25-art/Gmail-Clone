import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi, setAccessToken, getAccessToken } from "../api/client.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      // Even if token is not in localStorage, refresh cookie might be valid
      const { data } = await authApi.getMe();
      if (data.success) {
        setUser(data.user);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleSessionExpired = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener("auth:logout", handleSessionExpired);
    return () => window.removeEventListener("auth:logout", handleSessionExpired);
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const { data } = await authApi.login({ email, password });
      if (data.success) {
        setAccessToken(data.accessToken);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed. Check your credentials.";
      setAuthError(message);
      return { success: false, message };
    }
  };

  const register = async (name, email, password) => {
    setAuthError(null);
    try {
      const { data } = await authApi.register({ name, email, password });
      if (data.success) {
        setAccessToken(data.accessToken);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed.";
      setAuthError(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout API failed:", err);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        setAuthError,
        login,
        register,
        logout,
        refreshUser: checkAuth,
      }}
    >
      {children}
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
