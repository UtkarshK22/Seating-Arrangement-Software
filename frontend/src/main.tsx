import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import App from "./App";
import AuditPage from "./pages/AuditPage";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      {/* LOGIN */}
      <Route path="/login" element={<LoginPage />} />

      {/* ROOT → just protect, no hardcoded floor */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/login" replace />
          </ProtectedRoute>
        }
      />

      {/* FLOOR MAP */}
      <Route
        path="/floors/:floorId"
        element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        }
      />

      {/* AUDIT */}
      <Route
        path="/floors/:floorId/audit"
        element={
          <ProtectedRoute>
            <AuditPage />
          </ProtectedRoute>
        }
      />

      {/* ADMIN */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  </BrowserRouter>
);