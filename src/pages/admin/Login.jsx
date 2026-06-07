import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { decodeJwt } from "../../utils/auth";

const API = "/api/auth/login";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const login = async () => {
    try {
      const res = await axios.post(API, {
        email,
        password,
      }, { withCredentials: true });

      const decoded = decodeJwt(res.data.token);
      const user = decoded || res.data.user;

      localStorage.removeItem("token");
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      navigate("/admin");
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow w-80">
        <h2 className="text-xl font-bold mb-4">Admin Login</h2>

        <input
          placeholder="Email"
          className="border p-2 w-full mb-2"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full mb-2"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          className="bg-blue-600 text-white w-full py-2"
        >
          Login
        </button>
      </div>
    </div>
  );
}
