import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loading } from "@/components/common";

export function ProtectedRoute({ children, admin = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading || user === null) return <Loading label="Checking your session…" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  if (admin && !isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}
