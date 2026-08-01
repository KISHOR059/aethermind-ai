import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import RouteLoading from "@/app/RouteLoading";

import { useAuth } from "../hooks/auth.context";

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <RouteLoading />;
  if (!isAuthenticated) return <Navigate replace state={{ from: location }} to="/login" />;
  return children;
}

export default RequireAuth;
