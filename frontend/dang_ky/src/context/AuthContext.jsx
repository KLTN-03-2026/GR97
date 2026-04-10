import { createContext, useContext, useMemo } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("healthyai_token", data.token);
    return data;
  };

  const value = useMemo(() => ({ register }), []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
