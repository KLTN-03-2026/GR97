import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import RouteTransition from "./components/RouteTransition";
import RegisterPage from "./pages/RegisterPage";
import AuthLayout from "./layouts/AuthLayout";

const App = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={<Navigate to="/register" replace />}
        />
        <Route
          path="/register"
          element={
            <RouteTransition>
              <AuthLayout>
                <RegisterPage />
              </AuthLayout>
            </RouteTransition>
          }
        />
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default App;
