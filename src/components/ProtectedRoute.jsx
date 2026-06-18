import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem("token");

  // extra safety: handle empty string / invalid values
  const isAuthenticated = token && token !== "null" && token !== "undefined";

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}