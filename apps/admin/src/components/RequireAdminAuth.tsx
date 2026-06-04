import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { clearStoredAuthTokens, hasStoredAuthTokens } from "../lib/auth";

export function RequireAdminAuth() {
  const location = useLocation();
  const hasTokens = hasStoredAuthTokens();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => apiFetch<{ user: { role?: string } | null }>("/api/auth/me"),
    enabled: hasTokens,
    retry: false,
    refetchOnMount: "always"
  });

  if (!hasTokens) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#08111e] text-pearl">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-white/70">
          Checking admin access...
        </div>
      </div>
    );
  }

  if (isError || !data?.user || data.user.role !== "admin") {
    clearStoredAuthTokens();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
