import { useState } from "react";
import { NAV_ITEMS } from "../data/initial";
import { fmtDateLong } from "../helpers";

const NAV_ICONS = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="6" height="7" rx="1.5" /><rect x="11" y="1" width="6" height="4" rx="1.5" /><rect x="1" y="12" width="6" height="5" rx="1.5" /><rect x="11" y="9" width="6" height="8" rx="1.5" />
    </svg>
  ),
  cleaning: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M9 1v8" /><path d="M5 9c0 0-3 1-3 5v2h14v-2c0-4-3-5-3-5" /><circle cx="9" cy="3" r="1" fill="currentColor" />
    </svg>
  ),
  people: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="5" r="3" /><path d="M1 16c0-3 2.5-5 6-5s6 2 6 5" /><circle cx="14" cy="5" r="2" /><path d="M17 16c0-2.5-1.5-4-4-4" />
    </svg>
  ),
  inventory: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1L2 5v8l7 4 7-4V5L9 1z" /><path d="M2 5l7 4 7-4" /><path d="M9 9v8" />
    </svg>
  ),
  docs: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 1h7l4 4v11a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" /><path d="M11 1v4h4" /><path d="M6 9h6M6 12h4" />
    </svg>
  ),
  flask: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h6M7 2v6L3 14a2 2 0 001.7 3h8.6A2 2 0 0015 14L11 8V2" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="9" cy="9" r="2.5" /><path d="M14.3 11a1.2 1.2 0 00.2 1.3l.1.1a1.5 1.5 0 11-2.1 2.1l-.1-.1a1.2 1.2 0 00-1.3-.2 1.2 1.2 0 00-.7 1.1v.2a1.5 1.5 0 01-3 0v-.1a1.2 1.2 0 00-.8-1.1 1.2 1.2 0 00-1.3.2l-.1.1a1.5 1.5 0 11-2.1-2.1l.1-.1a1.2 1.2 0 00.2-1.3 1.2 1.2 0 00-1.1-.7H2a1.5 1.5 0 010-3h.1A1.2 1.2 0 003.2 6a1.2 1.2 0 00-.2-1.3l-.1-.1a1.5 1.5 0 112.1-2.1l.1.1A1.2 1.2 0 006.4 3 1.2 1.2 0 007 1.8V1.5a1.5 1.5 0 013 0v.1a1.2 1.2 0 00.7 1.1 1.2 1.2 0 001.3-.2l.1-.1a1.5 1.5 0 112.1 2.1l-.1.1a1.2 1.2 0 00-.2 1.3c.1.3.4.6.8.7h.3a1.5 1.5 0 010 3h-.1a1.2 1.2 0 00-1.1.8z" />
    </svg>
  ),
};

export default function Sidebar({ view, setView, user, onLogout, collapsed, setCollapsed }) {
  const today = fmtDateLong();

  const roleColor = {
    admin: "var(--color-primary)",
    control: "var(--color-warning)",
    seguimiento: "var(--color-success)",
  };

  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <path d="M16 2C16 2 8 8 8 16c0 4.4 3.6 8 8 8s8-3.6 8-8c0-8-8-14-8-14z" fill="currentColor" />
              <path d="M16 6c0 0-4 4-4 10 0 2.2 1.8 4 4 4s4-1.8 4-4c0-6-4-10-4-10z" fill="rgba(255,255,255,0.25)" />
            </svg>
          </div>
          {!collapsed && (
            <div className="sidebar-logo-text">
              <span className="sidebar-logo-title">SGIA Limpieza</span>
              <span className="sidebar-logo-sub">INGAMA · Riberalta</span>
            </div>
          )}
        </div>
        <button className="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            {collapsed ? <path d="M6 3l5 5-5 5" /> : <path d="M10 3L5 8l5 5" />}
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((n) => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            className={`sidebar-nav-item ${view === n.id ? "active" : ""}`}
            title={collapsed ? n.label : undefined}
          >
            <span className="sidebar-nav-icon">{NAV_ICONS[n.icon]}</span>
            {!collapsed && <span className="sidebar-nav-label">{n.label}</span>}
            {view === n.id && <span className="sidebar-nav-indicator" />}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="sidebar-user">
        {!collapsed && <p className="sidebar-date">{today}</p>}
        <div className="sidebar-user-info">
          <div className="sidebar-avatar" style={{ borderColor: roleColor[user.role] || "var(--color-primary)" }}>
            {user.initials}
          </div>
          {!collapsed && (
            <div className="sidebar-user-text">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-role">{user.roleLabel}</span>
            </div>
          )}
        </div>
        <button className="sidebar-logout" onClick={onLogout} title="Cerrar sesión">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3" /><path d="M10 11l3-3-3-3" /><path d="M13 8H6" />
          </svg>
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
