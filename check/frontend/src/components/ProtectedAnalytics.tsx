import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { hasPermission } from "../auth/permissions";
import { AnalyticsPage } from "../pages/AnalyticsPage";

export default function ProtectedAnalytics() {
  const { user } = useAuth();

  if (!hasPermission(user?.role, "VIEW_ANALYTICS")) {
    return <Navigate to="/login" replace />;
  }

  return <AnalyticsPage />;
}