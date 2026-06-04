import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { hasStoredAuthTokens, setStoredAuthTokens } from "../lib/auth";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("methodist@padikuppam.com");
  const [password, setPassword] = useState("padikupam107");

  useEffect(() => {
    if (!hasStoredAuthTokens()) {
      return;
    }

    let mounted = true;

    apiFetch<{ user: { role?: string } | null }>("/api/auth/me")
      .then(() => {
        if (mounted) {
          navigate("/dashboard", { replace: true });
        }
      })
      .catch(() => {
        // no session yet
      });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const loginMutation = useMutation({
    mutationFn: async () =>
      apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      }),
    onSuccess: (data) => {
      setStoredAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      });
      navigate("/dashboard", { replace: true });
    },
    onError: () => {
      // Keep the form visible; the server already returns a useful error message.
    }
  });

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.35em] text-gold/80">Private Access</p>
        <h1 className="mt-3 text-3xl font-semibold">Administrator Login</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Sign in to manage pages, sections, media, pastors, sermons, events, and settings.
        </p>
        <form
          className="mt-8 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            loginMutation.mutate();
          }}
        >
          <input
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none placeholder:text-white/30"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none placeholder:text-white/30"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className="rounded-2xl bg-gold px-4 py-3 font-semibold text-ink" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
