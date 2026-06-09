import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /* ================= LOGIN ================= */
  const handleLogin = async () => {
    try {
      setLoading(true);

      const res = await API.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      navigate("/admin");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Admin Login</h2>

        {/* EMAIL */}
        <input
          style={styles.input}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* PASSWORD WITH TOGGLE */}
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
            onClick={() => setShowPassword((prev) => !prev)}
            style={styles.toggleBtn}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* LOGIN BUTTON */}
        <button
          onClick={handleLogin}
          style={styles.loginBtn}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* CLIENT BUTTON */}
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
    background: "#54091b",
  },

  card: {
    width: "340px",
    padding: "25px",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  title: {
    textAlign: "center",
    marginBottom: "10px",
    fontWeight: "bold",
    color: "#54091b",
  },

  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    outline: "none",
  },

  passwordBox: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },

  toggleBtn: {
    position: "absolute",
    right: "10px",
    background: "transparent",
    border: "none",
    color: "#e11d48",
    cursor: "pointer",
    fontWeight: "bold",
  },

  loginBtn: {
    padding: "10px",
    border: "none",
    borderRadius: "6px",
    background: "#e11d48",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  },

  clientBtn: {
    padding: "10px",
    border: "1px solid #e11d48",
    borderRadius: "6px",
    background: "transparent",
    color: "#e11d48",
    cursor: "pointer",
    fontWeight: "bold",
  },
};