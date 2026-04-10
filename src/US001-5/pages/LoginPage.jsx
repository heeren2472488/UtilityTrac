import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, passwordService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // MAIN LOGIN HANDLER WITH ROLE-BASED REDIRECT
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.login(form);

      console.log("FULL RESPONSE:", res.data);

      // FIX: login response lives in res.data.data
      const payload = res?.data?.data;

      const token = payload?.token;
      const roles = payload?.roles;
      const userData = {
        userId: payload.userId,
        name: payload.name,
        email: payload.email,
        forcePasswordChange: payload.forcePasswordChange,
        remainingAttempts: payload.remainingAttempts
      };

      // Save user + token
      login({ ...userData, roles }, token);

      // Extract role
      const role = roles?.[0]?.toUpperCase();
      console.log("ROLE FROM BACKEND:", role);

      // Redirection logic
      switch (role) {
        case "ADMIN":
          return navigate("/admin");

        case "TECHNICIAN":
        case "FIELD TECHNICIAN":
          return navigate("/technician");

        case "OPERATION PLANNER":
        case "OPERATIONS PLANNER":
          return navigate("/planner");

        case "CONTROL ROOM OPERATOR":
        case "CONTOR ROOM OPERATOR":
          return navigate("/controller");

        case "BILLING AND CUSTOMER OPS":
        case "BILLING CUSTOMERS OPS":
          return navigate("/billing");

        case "REGULATORY ANALYST":
          return navigate("/regulatory");

        case "UTILITY ADMIN":
          return navigate("/admin");

        default:
          return navigate("/");
      }

    } catch (err) {
      setError("Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  // RESET PASSWORD HANDLER
  const handleReset = async (e) => {
    e.preventDefault();
    try {
        console.log("Requesting password reset for:", resetEmail);
      await passwordService.forgotPassword(resetEmail);
      setResetMsg('Reset link sent! Check your email.');
    } catch {
      setResetMsg('Could not send reset email.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-grid" />
      <div className="login-glow" />

      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">⬡</div>
          <div>
            <div className="login-title">UtiliTrack</div>
            <div className="login-module">Cyber utility operations</div>
          </div>
        </div>

        {!showReset ? (
          <form onSubmit={handleLogin} className="login-form">
            <div className="login-heading">Sign in to your account</div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? "Authenticating…" : "Sign In →"}
            </button>

            <button type="button" className="forgot-link" onClick={() => setShowReset(true)}>
              Forgot password?
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="login-form">
            <div className="login-heading">Reset Password</div>
            {resetMsg && <div className="alert alert-success">{resetMsg}</div>}

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                required
              />
            </div>

            <button className="login-submit" type="submit">
              Send Reset Link
            </button>
            <button type="button" className="forgot-link" onClick={() => setShowReset(false)}>
              ← Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}