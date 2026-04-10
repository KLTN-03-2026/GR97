import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import RouteTransition from "./components/RouteTransition";
import ProtectedRoute from "./components/ProtectedRoute";
import TimeoutWarning from "./components/TimeoutWarning";

// Booking Pages
import AppointmentsPage from "./pages/AppointmentsPage";
import PaymentPage from "./pages/PaymentPage";
import QRPaymentPage from "./pages/QRPaymentPage";
import PaymentResultPage from "./pages/PaymentResultPage";

// Auth Pages (needed to book)
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
          element={<Navigate to={isAuthenticated ? "/appointments" : "/login"} replace />}
        />

        {/* --- BOOKING --- */}
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <RouteTransition>
                <AppointmentsPage />
              </RouteTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <RouteTransition>
                <PaymentPage />
              </RouteTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/qr"
          element={
            <ProtectedRoute>
              <RouteTransition>
                <QRPaymentPage />
              </RouteTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/vnpay_return"
          element={
            <RouteTransition>
              <PaymentResultPage />
            </RouteTransition>
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

        <Route path="*" element={<Navigate to="/appointments" replace />} />
      </Routes>
      <TimeoutWarning />
    </AnimatePresence>
  );
};

export default App;
