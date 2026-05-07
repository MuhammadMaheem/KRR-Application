import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore";

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((s) => s.token);
  const { pathname } = useLocation();

  if (!token) {
    return <Navigate to="/" state={{ from: pathname }} replace />;
  }
  return children;
};

export default ProtectedRoute;
