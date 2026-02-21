import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import api from "../api/http";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1️⃣ Login
      const res = await login(email, password);
      localStorage.setItem("token", res.access_token);

      // 2️⃣ Fetch floors for this organization
      const floors = await api<{ id: string; name: string }[]>("/floors");

      if (!floors.length) {
        setError("No floors found for this organization.");
        return;
      }

      // 3️⃣ Navigate to first available floor
      const firstFloorId = floors[0].id;
      navigate(`/floors/${firstFloorId}`);
    } catch{
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#020617",
        color: "#e5e7eb",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 320,
          padding: 24,
          borderRadius: 8,
          background: "#020617",
          border: "1px solid #1f2937",
        }}
      >
        <h2 style={{ marginBottom: 16 }}>Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 12, padding: 8 }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 12, padding: 8 }}
        />

        {error && (
          <div style={{ color: "red", marginBottom: 12 }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 10 }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}