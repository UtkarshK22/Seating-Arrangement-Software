import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import React from "react";

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}
