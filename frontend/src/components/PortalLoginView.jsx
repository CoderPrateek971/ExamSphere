import React, { useState } from 'react';
import { Eye, EyeOff, Layers } from 'lucide-react';
import { api } from '../api';

export default function PortalLoginView({ onLoginSuccess }) {
  const [selectedPortal, setSelectedPortal] = useState('TEACHER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectPortal = (portal) => {
    setSelectedPortal(portal);
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail && !trimmedPassword) {
      setError('Email and password are required');
      return;
    }
    if (!trimmedEmail) {
      setError('Email is required');
      return;
    }
    if (!trimmedPassword) {
      setError('Password is required');
      return;
    }

    const expectedRole = selectedPortal === 'ADMIN' ? 'ADMIN' : 'FACULTY';

    setError('');
    setLoading(true);
    try {
      const res = await api.login(trimmedEmail, password, expectedRole);
      api.setToken(res.data.token);
      api.setUser(res.data.user);
      onLoginSuccess(res.data.user);
    } catch (err) {
      setError(err.message || 'Could not sign in. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <div className="brand-logo"><Layers size={21} /></div>
          <div className="brand-text">
            <h1>ExamSphere</h1>
            <p>Examination management</p>
          </div>
        </div>

        <h2 id="login-title">Sign in</h2>
        <p className="login-intro">Choose your account type to continue.</p>

        <div className="portal-picker" role="group" aria-label="Account type">
          <button type="button" className={selectedPortal === 'TEACHER' ? 'selected' : ''} onClick={() => selectPortal('TEACHER')}>
            Faculty
          </button>
          <button type="button" className={selectedPortal === 'ADMIN' ? 'selected' : ''} onClick={() => selectPortal('ADMIN')}>
            Administrator
          </button>
        </div>

        <form onSubmit={handleLogin} noValidate>
          <label className="login-field">
            Email address
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="login-field">
            <span className="login-field-heading">
              Password
              <button type="button" className="text-button" onClick={() => setShowPassword((visible) => !visible)}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
