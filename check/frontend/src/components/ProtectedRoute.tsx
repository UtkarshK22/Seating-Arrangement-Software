import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import React from "react";

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const { user, isLoading } = useAuth();

  // ✅ Wait until token validation finishes
  if (isLoading) {
    return null; // or a loading spinner if you want
  }

  // ✅ Only redirect if definitely not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}