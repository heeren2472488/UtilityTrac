import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, passwordService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ThemeToggleButton from '../components/layout/ThemeToggleButton';
import './LoginPage.css';

const toRolesArray = (rawRoles) => {
  if (Array.isArray(rawRoles)) return rawRoles;
  if (typeof rawRoles === 'string') {
    return rawRoles
      .replaceAll('[', '')
      .replaceAll(']', '')
      .replace(/["']/g, '')
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);
  }
  if (rawRoles && typeof rawRoles === 'object') {
    if (Array.isArray(rawRoles.roles)) return rawRoles.roles;
    if (Array.isArray(rawRoles.authorities)) return rawRoles.authorities;
  }
  return [];
};

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
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
      const roles = toRolesArray(payload?.roles ?? payload?.authorities ?? payload?.roleNames);
      const userData = {
        userId: payload.userId,
        name: payload.name,
        email: payload.email,
        forcePasswordChange: payload.forcePasswordChange,
        remainingAttempts: payload.remainingAttempts
      };

      // Save user + token
      login({ ...userData, roles }, token);

      console.log("ROLES FROM BACKEND:", roles);
      // All roles land on /dashboard — DashboardPage handles role-based rendering
      return navigate("/dashboard");

    } catch (err) {
      setError("Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  // RESET PASSWORD HANDLER
  const handleReset = async (e) => {
    e.preventDefault();
    setResetMsg('');
    setResetError('');

    const email = resetEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setResetError('Invalid email format. Please enter a valid email address.');
      return;
    }

    setResetLoading(true);
    try {
      console.log("Requesting password reset for:", email);
      await passwordService.forgotPassword(email);
      setResetMsg('Reset link sent! Check your email.');
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err?.response?.data?.error || '';

      if (status === 404 || /not\s*found|not\s*registered|does\s*not\s*exist/i.test(String(message))) {
        setResetError('Email is not registered.');
      } else if (status === 400 || /invalid\s*email|bad\s*request/i.test(String(message))) {
        setResetError('Invalid email address.');
      } else {
        setResetError('Could not send reset email. Please try again.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="login-page">
      <ThemeToggleButton />
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
            {resetError && <div className="alert alert-error">{resetError}</div>}

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={e => {
                  setResetEmail(e.target.value);
                  if (resetError) setResetError('');
                  if (resetMsg) setResetMsg('');
                }}
                required
              />
            </div>

            <button className="login-submit" type="submit" disabled={resetLoading}>
              {resetLoading ? 'Sending…' : 'Send Reset Link'}
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