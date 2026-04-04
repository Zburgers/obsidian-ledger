import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "./authStore";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await register(email, password, name || undefined);
      navigate("/dashboard");
    } catch {
      // error set in store
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-card" aria-labelledby="register-title">
        <h1 id="register-title" className="page-title">Register</h1>
        <p className="auth-subtitle">Set up your profile to start tracking team finances.</p>
        {error && <p data-testid="error" className="error">{error}</p>}
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          </div>
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
              {isLoading ? "Registering..." : "Register"}
            </button>
            <Link className="nav-link" to="/login">Back to login</Link>
          </div>
        </form>
      </section>
    </div>
  );
}
