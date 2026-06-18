import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  const isAuthenticated =
    token &&
    token !== "null" &&
    token !== "undefined";

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}