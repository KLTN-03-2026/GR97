import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const INACTIVITY_TIMEOUT = 5 * 60 * 1000;
const WARNING_TIME = 60 * 1000; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);

  const token = localStorage.getItem("healthyai_token") || sessionStorage.getItem("healthyai_token");

  const logoutDueToInactivity = useCallback(() => {
    localStorage.removeItem("healthyai_token");
    sessionStorage.removeItem("healthyai_token");
    setUser(null);
    setShowTimeoutWarning(false);
    navigate("/login?reason=timeout");
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

      warningTimeoutRef.current = setTimeout(() => {
        setShowTimeoutWarning(true);
      }, INACTIVITY_TIMEOUT - WARNING_TIME);

      timeoutRef.current = setTimeout(() => {
        logoutDueToInactivity();
      }, INACTIVITY_TIMEOUT);
    };

    const activities = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    activities.forEach((activity) => document.addEventListener(activity, handleActivity));

    handleActivity();

    return () => {
      activities.forEach((activity) => document.removeEventListener(activity, handleActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [user, logoutDueToInactivity]);

  const extendSession = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

    warningTimeoutRef.current = setTimeout(() => {
      setShowTimeoutWarning(true);
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    timeoutRef.current = setTimeout(() => {
      logoutDueToInactivity();
    }, INACTIVITY_TIMEOUT);

    setShowTimeoutWarning(false);
  }, [logoutDueToInactivity]);

  useEffect(() => {
    const loadMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401 || status === 404 || !error.response) {
          localStorage.removeItem("healthyai_token");
          sessionStorage.removeItem("healthyai_token");
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, [token]);

  const refreshUser = async () => {
    const existingToken = localStorage.getItem("healthyai_token") || sessionStorage.getItem("healthyai_token");
    if (!existingToken) return null;

    const { data } = await api.get("/auth/me");
    setUser(data.user);
    return data.user;
  };

  const setToken = (newToken, rememberMe = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("healthyai_token", newToken);
  };

  const login = async (identifier, password, rememberMe = false) => {
    const { data } = await api.post("/auth/login", { identifier, password });
    
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("healthyai_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("healthyai_token");
    sessionStorage.removeItem("healthyai_token");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshUser,
      setUser,
      setToken,
      showTimeoutWarning,
      extendSession,
    }),
    [user, loading, showTimeoutWarning, extendSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
