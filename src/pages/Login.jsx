import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

// icons
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /* ================= LOGIN ================= */
  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/login", {
        email,
        password,
      });

      const token = res?.data?.token;

      if (!token) {
        throw new Error("No token received from server");
      }

      localStorage.setItem("token", token);

      navigate("/admin");
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h2 style={styles.h2}>MTC Padikuppam</h2>
        <h4 style={styles.h4}>Admin Login</h4>

        {/* EMAIL */}
        <input
          style={styles.input}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* PASSWORD */}
        <div style={styles.passwordBox}>
          <input
            style={styles.input}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            style={styles.eyeBtn}
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>

        {/* LOGIN BUTTON */}
        <button
          onClick={handleLogin}
          style={{
            ...styles.loginBtn,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* GO TO CLIENT */}
        <button
          onClick={() => (window.location.href = "/")}
          style={styles.clientBtn}
        >
          Go To MTC
        </button>

      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #e11d48, #54091b)",
  },

  card: {
    width: "360px",
    padding: "25px",
    borderRadius: "14px",
    background: "#fff",
    boxShadow: "0 15px 40px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  h2: {
    textAlign: "center",
    margin: 0,
    color: "#54091b",
    fontWeight: "bold",
  },

  h4: {
    textAlign: "center",
    marginTop: "-5px",
    marginBottom: "10px",
    color: "#666",
    fontWeight: "500",
  },

  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    outline: "none",
    fontSize: "14px",
  },

  passwordBox: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },

  eyeBtn: {
    position: "absolute",
    right: "10px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#666",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  loginBtn: {
    padding: "10px",
    border: "none",
    borderRadius: "8px",
    background: "#e11d48",
    color: "#fff",
    fontWeight: "bold",
  },

  clientBtn: {
    padding: "10px",
    border: "1px solid #e11d48",
    borderRadius: "8px",
    background: "transparent",
    color: "#e11d48",
    fontWeight: "bold",
  },
};