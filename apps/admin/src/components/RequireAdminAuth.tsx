import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { apiFetch } from "../lib/api";

export function RequireAdminAuth() {
  const location = useLocation();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => apiFetch<{ user: unknown }>("/api/auth/me")
  });

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#08111e] text-pearl">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-white/70">
          Checking admin access...
        </div>
      </div>
    );
  }

  if (isError || !data?.user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

