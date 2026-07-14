import { useState } from "react";
import API from "../api/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEye, FiEyeOff, FiMail, FiLock, FiArrowLeft, FiLoader, FiKey } from "react-icons/fi";
import profileImg from "../assets/profile.jpg";

export default function Login() {
  const [view, setView] = useState("login"); // "login", "forgot", "reset"
  
  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Reset State
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Shared State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoError, setLogoError] = useState(false);

  /* ================= LOGIN ================= */
  const handleLogin = async (e) => {
    e?.preventDefault(); 

    if (loading) return;
    setError(""); 

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Please enter both email and password.");
      return;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("user");
    localStorage.removeItem("admin");

    try {
      setLoading(true);

      console.log('🔎 Login request payload', { email: cleanEmail, password: '[REDACTED]' });
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

      setTimeout(() => {
        window.location.href = "/admin/dashboard";
      }, 500);

    } catch (err) {
      console.error("LOGIN ERROR", err);
      const message = err?.response?.data?.message || "Login failed";
      setError(message);
      
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Incorrect email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= FORGOT PASSWORD ================= */
  const handleForgotPassword = async (e) => {
    e?.preventDefault();
    if (loading) return;
    setError("");

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your registered email.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/auth/forgot-password", { email: cleanEmail });
      toast.success(res.data.message || "OTP sent to your email.");
      setView("reset");
    } catch (err) {
      console.error("FORGOT PASSWORD ERROR", err);
      setError(err?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= RESET PASSWORD ================= */
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    if (loading) return;
    setError("");

    if (!otp || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/auth/reset-password", { 
        email: email.trim(), 
        otp, 
        newPassword,
        confirmPassword 
      });
      
      toast.success(res.data.message || "Password changed successfully. You can now log in using your new password.");
      setPassword(newPassword); // Pre-fill login
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setView("login");
    } catch (err) {
      console.error("RESET PASSWORD ERROR", err);
      setError(err?.response?.data?.message || "Invalid OTP or request.");
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

        {/* Main Card */}
        <div className="relative w-full max-w-[420px] rounded-[20px] border border-[#D4AF37]/30 bg-[#F6EFE3] p-8 shadow-2xl z-10 transition-all duration-300">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full border-2 border-[#D4AF37]/60 bg-[#F6EFE3] shadow-md">
              {!logoError ? (
                <img
                  src={profileImg}
                  alt="Church Profile"
                  className="h-full w-full object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-xl font-bold text-[#531B24]">MTC</span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#531B24]">
              MTC Padikuppam
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {view === "login" && "Church Administration Portal"}
              {view === "forgot" && "Reset Password"}
              {view === "reset" && "Enter OTP"}
            </p>
          </div>

          {/* Form switch based on view */}
          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-5 animate-fadeIn">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#531B24]/80 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <FiMail className="absolute left-3.5 text-slate-400" size={18} />
                  <input
                    type="email"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-[15px] font-medium text-slate-800 shadow-sm outline-none transition-all focus:border-[#531B24] focus:ring-2 focus:ring-[#531B24]/20"
                    placeholder="admin@church.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#531B24]/80 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative flex items-center">
                  <FiLock className="absolute left-3.5 text-slate-400" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-10 text-[15px] font-medium text-slate-800 shadow-sm outline-none transition-all focus:border-[#531B24] focus:ring-2 focus:ring-[#531B24]/20"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 flex items-center text-slate-400 hover:text-[#531B24]"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                
                {/* Forgot Password Link */}
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setView("forgot");
                    }}
                    className="text-xs font-semibold text-[#531B24] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="mt-2 min-h-[20px]">
                  {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#531B24] to-[#7A2533] py-3.5 text-[15px] font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl disabled:opacity-70"
              >
                {loading ? <FiLoader className="animate-spin" size={18} /> : "Login to Dashboard"}
              </button>
            </form>
          )}

          {view === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-5 animate-fadeIn">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#531B24]/80 uppercase tracking-wider">
                  Registered Email
                </label>
                <div className="relative flex items-center">
                  <FiMail className="absolute left-3.5 text-slate-400" size={18} />
                  <input
                    type="email"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-[15px] font-medium text-slate-800 shadow-sm outline-none transition-all focus:border-[#531B24] focus:ring-2 focus:ring-[#531B24]/20"
                    placeholder="admin@church.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mt-2 min-h-[20px]">
                  {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#531B24] to-[#7A2533] py-3.5 text-[15px] font-bold text-white shadow-lg transition-all hover:brightness-110 disabled:opacity-70"
              >
                {loading ? <FiLoader className="animate-spin" size={18} /> : "Send OTP"}
              </button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setError(""); setView("login"); }}
                  className="text-sm font-semibold text-slate-500 hover:text-[#531B24]"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}

          {view === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-5 animate-fadeIn">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#531B24]/80 uppercase tracking-wider">
                  6-Digit OTP
                </label>
                <div className="relative flex items-center">
                  <FiKey className="absolute left-3.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    maxLength={6}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-[15px] font-medium text-slate-800 tracking-[0.5em] shadow-sm outline-none transition-all focus:border-[#531B24] focus:ring-2 focus:ring-[#531B24]/20"
                    placeholder="------"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#531B24]/80 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <FiLock className="absolute left-3.5 text-slate-400" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-10 text-[15px] font-medium text-slate-800 shadow-sm outline-none transition-all focus:border-[#531B24] focus:ring-2 focus:ring-[#531B24]/20"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 flex items-center text-slate-400 hover:text-[#531B24]"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#531B24]/80 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <FiLock className="absolute left-3.5 text-slate-400" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-10 text-[15px] font-medium text-slate-800 shadow-sm outline-none transition-all focus:border-[#531B24] focus:ring-2 focus:ring-[#531B24]/20"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className="mt-2 min-h-[20px]">
                  {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#531B24] to-[#7A2533] py-3.5 text-[15px] font-bold text-white shadow-lg transition-all hover:brightness-110 disabled:opacity-70"
              >
                {loading ? <FiLoader className="animate-spin" size={18} /> : "Reset Password"}
              </button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setError(""); setView("login"); }}
                  className="text-sm font-semibold text-slate-500 hover:text-[#531B24]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Footer Back to Site */}
          {view === "login" && (
            <div className="mt-6 flex items-center justify-center border-t border-[#D4AF37]/20 pt-6">
              <button
                type="button"
                onClick={() => (window.location.href = "/")}
                className="group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#531B24] bg-transparent py-3 text-[14px] font-bold text-[#531B24] transition-all hover:bg-[#531B24]/5"
              >
                <FiArrowLeft className="transition-transform group-hover:-translate-x-1" size={16} />
                Back to Church Website
              </button>
            </div>
          )}
          
          <div className="mt-8 text-center text-[10px] font-medium uppercase tracking-widest text-slate-400/80">
            © 2026 Methodist Tamil Church <br /> Padikuppam
          </div>
        </div>
      </div>
    </>
  );
}
