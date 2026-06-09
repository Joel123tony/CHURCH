import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

      // store token (example)
      localStorage.setItem("token", res.data.token);

      navigate("/admin"); // redirect admin dashboard
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

        <input
          style={styles.input}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* LOGIN BUTTON */}
        <button
          onClick={handleLogin}
          style={styles.loginBtn}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* GO TO CLIENT SITE BUTTON */}
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
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
  },

  card: {
    width: "320px",
    padding: "25px",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  title: {
    textAlign: "center",
    marginBottom: "10px",
  },

  input: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    outline: "none",
  },

  loginBtn: {
    padding: "10px",
    border: "none",
    borderRadius: "6px",
    background: "#16a34a",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  },

  clientBtn: {
    padding: "10px",
    border: "1px solid #16a34a",
    borderRadius: "6px",
    background: "transparent",
    color: "#16a34a",
    cursor: "pointer",
    fontWeight: "bold",
  },
};