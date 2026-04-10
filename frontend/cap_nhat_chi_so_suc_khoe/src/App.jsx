import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import RouteTransition from "./components/RouteTransition";
import ProtectedRoute from "./components/ProtectedRoute";
import TimeoutWarning from "./components/TimeoutWarning";

// Feature Pages
import DashboardPage from "./pages/DashboardPage";

// Auth Pages (needed to login to access metrics)
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AuthLayout from "./layouts/AuthLayout";

import { useAuth } from "./context/AuthContext";

const App = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RouteTransition>
                <DashboardPage />
              </RouteTransition>
            </ProtectedRoute>
          }
        />

        {/* --- AUTH --- */}
        <Route
          path="/login"
          element={
            <RouteTransition>
              <AuthLayout showRegisterHint>
                <LoginPage />
              </AuthLayout>
            </RouteTransition>
          }
        />
        <Route
          path="/register"
          element={
            <RouteTransition>
              <AuthLayout showLoginHint>
                <RegisterPage />
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

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <TimeoutWarning />
    </AnimatePresence>
  );
};

export default App;
