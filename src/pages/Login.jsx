import { useState } from "react";
import API from "../api/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEye, FiEyeOff, FiMail, FiLock, FiArrowLeft, FiLoader } from "react-icons/fi";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ================= LOGIN ================= */
  const handleLogin = async (e) => {
    e?.preventDefault(); // Handle form submission
    
    if (loading) return;
    setError(""); // Clear previous errors

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/login", {
        email: cleanEmail,
        password,
      });

      const token = res?.data?.token;
      const user = res?.data?.user;

      if (!token) {
        setError("Invalid response from server.");
        return;
      }

      // ✅ Match AdminLayout
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user || {}));

      toast.success("Login Successful", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      // redirect after a tiny delay for toast to render
      setTimeout(() => {
        window.location.href = "/admin/dashboard";
      }, 500);

    } catch (err) {
      console.log("LOGIN ERROR", err);
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Incorrect email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <ToastContainer />
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#2E0B12] via-[#531B24] to-[#1A060A] p-4 sm:p-8">
      {/* Subtle Noise Texture (CSS Only) */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      
      {/* Soft Radial Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4AF37] opacity-5 blur-[120px]" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-[420px] rounded-[20px] border border-[#D4AF37]/30 bg-[#F6EFE3] p-8 shadow-2xl z-10 transition-all duration-300">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#531B24]/10 border border-[#D4AF37]/40 shadow-sm">
            <span className="text-xl font-bold text-[#531B24]">MTC</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#531B24]">
            MTC Padikuppam
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Church Administration Portal
          </p>
        </div>

        {/* Form */}
        <form 
          onSubmit={handleLogin}
          className="space-y-5"
        >
          {/* Email Input */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#531B24]/80 uppercase tracking-wider" htmlFor="email">
              Email Address
            </label>
            <div className="relative flex items-center">
              <FiMail className="absolute left-3.5 text-slate-400" size={18} />
              <input
                id="email"
                type="email"
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-[15px] font-medium text-slate-800 shadow-sm outline-none transition-all focus:border-[#531B24] focus:ring-2 focus:ring-[#531B24]/20"
                placeholder="admin@church.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#531B24]/80 uppercase tracking-wider" htmlFor="password">
              Password
            </label>
            <div className="relative flex items-center">
              <FiLock className="absolute left-3.5 text-slate-400" size={18} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-10 text-[15px] font-medium text-slate-800 shadow-sm outline-none transition-all focus:border-[#531B24] focus:ring-2 focus:ring-[#531B24]/20"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3.5 flex cursor-pointer items-center justify-center border-none bg-transparent text-slate-400 hover:text-[#531B24] transition-colors focus:outline-none"
                tabIndex="-1"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            
            {/* Inline Error Message */}
            <div className="mt-2 min-h-[20px]">
              {error && (
                <p className="text-sm font-semibold text-red-500 animate-fadeIn">
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#531B24] to-[#7A2533] py-3.5 text-[15px] font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl active:translate-y-0 active:shadow-md disabled:pointer-events-none disabled:opacity-70"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" size={18} />
                <span>Logging in...</span>
              </>
            ) : (
              "Login to Dashboard"
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center border-t border-[#D4AF37]/20 pt-6">
          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className="group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#531B24] bg-transparent py-3 text-[14px] font-bold text-[#531B24] transition-all hover:bg-[#531B24]/5 focus:outline-none focus:ring-2 focus:ring-[#531B24]/30"
          >
            <FiArrowLeft className="transition-transform group-hover:-translate-x-1" size={16} />
            Back to Church Website
          </button>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-[10px] font-medium uppercase tracking-widest text-slate-400/80">
          © 2026 Methodist Tamil Church <br/> Padikuppam
        </div>
      </div>
    </div>
    </>
  );
}
