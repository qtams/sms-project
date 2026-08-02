import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const loadUser = async () => {
    try {
      const response = await api.get("/api/user");
      setUser(response.data.user);
    } catch {
      setUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const login = async ({ username, password, remember }) => {
    await api.get("/sanctum/csrf-cookie");

    const response = await api.post("/api/login", {
      username,
      password,
      remember,
    });

    setUser(response.data.user);

    return response.data.user;
  };

  const logout = async () => {
    try {
      await api.post("/api/logout");
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthLoading,
        login,
        logout,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
};