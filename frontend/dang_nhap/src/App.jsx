import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import RouteTransition from "./components/RouteTransition";
import ProtectedRoute from "./components/ProtectedRoute";
import TimeoutWarning from "./components/TimeoutWarning";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AuthLayout from "./layouts/AuthLayout";
import { useAuth } from "./context/AuthContext";

const App = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
        />

        <Route
          path="/login"
          element={
            <RouteTransition>
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            </RouteTransition>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <RouteTransition>
              <AuthLayout>
                <ForgotPasswordPage />
              </AuthLayout>
            </RouteTransition>
          }
        />
        <Route
          path="/reset-password"
          element={
            <RouteTransition>
              <AuthLayout>
                <ResetPasswordPage />
              </AuthLayout>
            </RouteTransition>
          }
        />

        {/* Protected route - dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RouteTransition>
                <div style={{ padding: "60px 40px", textAlign: "center" }}>
                  <h1>🎉 Đăng nhập thành công!</h1>
                  <p>Chào mừng <strong>{user?.fullName}</strong> đến với hệ thống.</p>
                  <p>Email: {user?.email}</p>
                  <p>Role: {user?.role}</p>
                  <button
                    onClick={logout}
                    style={{
                      marginTop: "20px",
                      padding: "10px 24px",
                      background: "#e74c3c",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "16px",
                    }}
                  >
                    Đăng xuất
                  </button>
                </div>
              </RouteTransition>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <TimeoutWarning />
    </AnimatePresence>
  );
};

export default App;
