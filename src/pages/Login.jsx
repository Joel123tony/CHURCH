import { useState } from "react";
import API from "../api/axios";

// icons
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= LOGIN ================= */
  const handleLogin = async () => {
    if (loading) return;

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/login", {
        email: cleanEmail,
        password,
      });

      console.log("FULL RESPONSE", res.data);

      const token = res?.data?.token;
      const user = res?.data?.user;

      if (!token) {
        alert("Login failed: Invalid response from server");
        return;
      }

      // ✅ IMPORTANT: match AdminLayout (localStorage)
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user || {}));

      // redirect
     window.location.href = "/admin/dashboard";

    } catch (err) {
      console.log("LOGIN ERROR", err);

      alert(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ENTER KEY SUPPORT */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#e11d48] to-[#54091b]">
      <div
        className="flex w-[360px] flex-col gap-3 rounded-[14px] bg-white p-[25px] shadow-[0_15px_40px_rgba(0,0,0,0.3)]"
        onKeyDown={handleKeyDown}
      >
        <h2 className="m-0 text-center font-bold text-[#54091b]">MTC Padikuppam</h2>
        <h4 className="mb-[10px] -mt-[5px] text-center font-medium text-[#666]">
          Admin Login
        </h4>

        {/* EMAIL */}
        <input
          className="w-full rounded-lg border border-[#ddd] p-[10px] text-[14px] outline-none"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />

        {/* PASSWORD */}
        <div className="relative flex items-center">
          <input
            className="w-full rounded-lg border border-[#ddd] p-[10px] text-[14px] outline-none"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-[10px] flex cursor-pointer items-center justify-center border-none bg-transparent text-[#666]"
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>

        {/* LOGIN BUTTON */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="rounded-lg border-none bg-[#e11d48] p-[10px] font-bold text-white transition-opacity"
          style={{
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* GO TO CLIENT */}
        <button
          onClick={() => (window.location.href = "/")}
          className="rounded-lg border border-[#e11d48] bg-transparent p-[10px] font-bold text-[#e11d48]"
        >
          Go To MTC
        </button>
      </div>
    </div>
  );
}
