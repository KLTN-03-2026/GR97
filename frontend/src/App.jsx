import { Suspense, lazy } from "react";
import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import RouteTransition from "./components/RouteTransition";
import ProtectedRoute from "./components/ProtectedRoute";
import TimeoutWarning from "./components/TimeoutWarning";
import AppFlashNotice from "./components/AppFlashNotice";
import AuthLayout from "./layouts/AuthLayout";
import PortalLayout from "./layouts/PortalLayout";
import PatientWorkspaceLayout from "./layouts/PatientWorkspaceLayout";
import AdminLayout from "./layouts/AdminLayout";
import { useAuth } from "./context/AuthContext";

// Lazy load pages for better performance
const AppointmentsPage = lazy(() => import("./pages/AppointmentsPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const MedicalRecordsPage = lazy(() => import("./pages/MedicalRecordsPage"));
const PaymentResultPage = lazy(() => import("./pages/PaymentResultPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const QRPaymentPage = lazy(() => import("./pages/QRPaymentPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AdminDoctorsPage = lazy(() => import("./pages/AdminDoctorsPage"));
const AdminDoctorDetailPage = lazy(() => import("./pages/AdminDoctorDetailPage"));
const PatientSettingsPage = lazy(() => import("./pages/PatientSettingsPage"));
const AdminSchedulesPage = lazy(() => import("./pages/AdminSchedulesPage"));
const AdminStatsPage = lazy(() => import("./pages/AdminStatsPage"));
const AdminSettingsPage = lazy(() => import("./pages/AdminSettingsPage"));
const AdminDoctorAccountPage = lazy(() => import("./pages/AdminDoctorAccountPage"));
const MedicalImageAnalysis = lazy(() => import("./components/MedicalImageAnalysis"));
const VideoCallPage = lazy(() => import("./pages/VideoCallPage"));
const DoctorChatPage = lazy(() => import("./pages/DoctorChatPage"));

// Loading component
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#2780de'
  }}>
    Đang tải...
  </div>
);


const App = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const defaultAuthRoute = user?.role === "admin" ? "/admin/dashboard" : "/dashboard";

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingSpinner />}>
        <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? defaultAuthRoute : "/login"} replace />}
        />

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
        <Route
          path="/payment-result"
          element={
            <RouteTransition>
              <PaymentResultPage />
            </RouteTransition>
          }
        />
        <Route
          path="/payment-page"
          element={
            <RouteTransition>
              <PaymentPage />
            </RouteTransition>
          }
        />
        <Route
          path="/payment/checkout"
          element={
            <RouteTransition>
              <QRPaymentPage />
            </RouteTransition>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RouteTransition>
                <PortalLayout>
                  <DashboardPage />
                </PortalLayout>
              </RouteTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctors"
          element={
            <ProtectedRoute>
              <RouteTransition>
                <PortalLayout>
                  <AppointmentsPage />
                </PortalLayout>
              </RouteTransition>
            </ProtectedRoute>
          }
        />
        <Route path="/appointments" element={<Navigate to="/doctors" replace />} />
        <Route path="/chat" element={<Navigate to="/diagnosis" replace />} />
        <Route
          path="/diagnosis"
          element={
            <ProtectedRoute>
              <RouteTransition>
                <PatientWorkspaceLayout>
                  <ChatPage />
                </PatientWorkspaceLayout>
              </RouteTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/records"
          element={
            <ProtectedRoute>
              <RouteTransition>
                <PatientWorkspaceLayout>
                  <MedicalRecordsPage />
                </PatientWorkspaceLayout>
              </RouteTransition>
            </ProtectedRoute>
          }
        />
        {/* New: Medical Image Analysis with GPT-4 Vision */}
        <Route
          path="/analyze"
          element={
            <ProtectedRoute>
              <RouteTransition>
                <PatientWorkspaceLayout>
                  <MedicalImageAnalysis />
                </PatientWorkspaceLayout>
              </RouteTransition>
            </ProtectedRoute>
          }
        />
        {/* New: Video Consultation with WebRTC */}
        <Route
          path="/video-call"
          element={
            <ProtectedRoute>
              <RouteTransition>
                <VideoCallPage />
              </RouteTransition>
            </ProtectedRoute>
          }
        />
        {/* New: Doctor Chat */}
        <Route
          path="/doctor-chat"
          element={
            <ProtectedRoute>
              <RouteTransition>
                <PatientWorkspaceLayout>
                  <DoctorChatPage />
                </PatientWorkspaceLayout>
              </RouteTransition>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <RouteTransition>
                <PatientWorkspaceLayout>
                  <PatientSettingsPage />
                </PatientWorkspaceLayout>
              </RouteTransition>
            </ProtectedRoute>
          }
        />

        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <RouteTransition>
                <AdminLayout>
                  <AdminDashboardPage />
                </AdminLayout>
              </RouteTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/doctors"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <RouteTransition>
                <AdminLayout>
                  <AdminDoctorsPage />
                </AdminLayout>
              </RouteTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/doctors/:id"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <RouteTransition>
                <AdminLayout>
                  <AdminDoctorDetailPage />
                </AdminLayout>
              </RouteTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/doctors/:id/account"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <RouteTransition>
                <AdminLayout>
                  <AdminDoctorAccountPage />
                </AdminLayout>
              </RouteTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/schedules"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <RouteTransition>
                <AdminLayout>
                  <AdminSchedulesPage />
                </AdminLayout>
              </RouteTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stats"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <RouteTransition>
                <AdminLayout>
                  <AdminStatsPage />
                </AdminLayout>
              </RouteTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <RouteTransition>
                <AdminLayout>
                  <AdminSettingsPage />
                </AdminLayout>
              </RouteTransition>
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <RouteTransition>
              <NotFoundPage />
            </RouteTransition>
          }
        />
        </Routes>
        <AppFlashNotice />
        <TimeoutWarning />
      </Suspense>
    </AnimatePresence>
  );
};

export default App;
