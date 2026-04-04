import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "./authStore";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      // error set in store
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-card" aria-labelledby="login-title">
        <h1 id="login-title" className="page-title">Login</h1>
        <p className="auth-subtitle">Access your finance workspace and recent activity.</p>
        {error && <p data-testid="error" className="error">{error}</p>}
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          </div>
          <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          </div>
          <div className="actions">
            <button className="btn-primary" type="submit" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </button>
            <Link className="nav-link" to="/register">Create account</Link>
          </div>
        </form>
      </section>
    </div>
  );
}
