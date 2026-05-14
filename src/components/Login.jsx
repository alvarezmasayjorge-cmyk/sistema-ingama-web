import { useState, useCallback } from "react";
import { USERS_DB } from "../data/initial";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const submit = useCallback(
    (e) => {
      e.preventDefault();
      setLoading(true);
      setError("");
      // Small delay for perceived loading
      setTimeout(() => {
        const found = USERS_DB.find((u) => u.username === username && u.password === password);
        if (found) {
          onLogin(found);
        } else {
          setError("Usuario o contraseña incorrectos");
          setLoading(false);
        }
      }, 600);
    },
    [username, password, onLogin]
  );


  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-bg-orb login-bg-orb-3" />
        <div className="login-bg-grid" />
      </div>

      <div className="login-card animate-scale-in">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 2C16 2 8 8 8 16c0 4.4 3.6 8 8 8s8-3.6 8-8c0-8-8-14-8-14z" fill="rgba(255,255,255,0.9)" />
              <path d="M16 6c0 0-4 4-4 10 0 2.2 1.8 4 4 4s4-1.8 4-4c0-6-4-10-4-10z" fill="rgba(255,255,255,0.3)" />
            </svg>
          </div>
          <h1 className="login-title">SGIA · Limpieza</h1>
          <p className="login-subtitle">Sistema de Gestión Integral — Beneficiadora INGAMA</p>
          <div className="login-badges">
            <span className="login-badge">FSSC 22000 v6</span>
            <span className="login-badge">ISO/TS 22002-1</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="login-form">
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="9" cy="5.5" r="3.5" />
                <path d="M2 16.5c0-3.5 3-5.5 7-5.5s7 2 7 5.5" />
              </svg>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                placeholder="Ej: admin"
                autoComplete="username"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="8" width="12" height="8" rx="2" />
                <path d="M6 8V5a3 3 0 016 0v3" />
              </svg>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                autoComplete="current-password"
                disabled={loading}
              />
              <button type="button" className="input-toggle" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1l14 14"/><path d="M6.5 6.5a2 2 0 002.8 2.8"/><path d="M2.5 5C1.5 6.3 1 8 1 8s2.5 5 7 5c1 0 1.8-.2 2.5-.5"/><path d="M13.5 11C14.5 9.7 15 8 15 8s-2.5-5-7-5c-1 0-1.8.2-2.5.5"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5S1 8 1 8z"/><circle cx="8" cy="8" r="2"/></svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error animate-shake">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="7"/><path d="M8 5v4M8 11v.5"/></svg>
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" />
                Ingresando...
              </span>
            ) : (
              "Ingresar al Sistema"
            )}
          </button>
        </form>


      </div>
    </div>
  );
}
