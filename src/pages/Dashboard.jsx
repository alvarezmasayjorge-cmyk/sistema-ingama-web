import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AREAS } from "../data/initial";
import { isExpired, isSoon } from "../helpers";

const CHART_COLORS = { approved: "#10b981", pending: "#f59e0b", rejected: "#ef4444", draft: "#94a3b8" };

export default function Dashboard({ records, personnel, supplies, setView }) {
  const stats = useMemo(() => {
    const total = records.length;
    const aprobados = records.filter((r) => r.estado === "aprobado").length;
    const pendientes = records.filter((r) => r.estado === "firmado_control").length;
    const rechazados = records.filter((r) => r.estado === "rechazado").length;
    const borradores = records.filter((r) => r.estado === "borrador").length;
    const insVenc = supplies.filter((s) => isExpired(s.venc)).length;
    const insSoon = supplies.filter((s) => !isExpired(s.venc) && isSoon(s.venc)).length;
    const persVenc = personnel.filter((p) => isExpired(p.vigencia)).length;
    const persSoon = personnel.filter((p) => !isExpired(p.vigencia) && isSoon(p.vigencia)).length;
    const cumplimiento = total > 0 ? Math.round((aprobados / total) * 100) : 0;
    return { total, aprobados, pendientes, rechazados, borradores, insVenc, insSoon, persVenc, persSoon, cumplimiento };
  }, [records, personnel, supplies]);

  const pieData = useMemo(() => [
    { name: "Aprobados", value: stats.aprobados, color: CHART_COLORS.approved },
    { name: "Pendientes", value: stats.pendientes, color: CHART_COLORS.pending },
    { name: "Rechazados", value: stats.rechazados, color: CHART_COLORS.rejected },
    { name: "Borrador", value: stats.borradores, color: CHART_COLORS.draft },
  ], [stats]);

  const areaData = useMemo(() =>
    AREAS.slice(0, 6).map((a) => {
      const recs = records.filter((x) => x.area === a);
      const ok = recs.filter((x) => x.estado === "aprobado").length;
      return {
        area: a.replace(" MP", "").replace(" Manual", "").replace(" y Sellado", ""),
        pct: recs.length ? Math.round((ok / recs.length) * 100) : 0,
      };
    }),
  [records]);

  const alerts = useMemo(() => {
    const a = [];
    if (stats.insVenc > 0) a.push({ type: "danger", msg: `${stats.insVenc} insumo(s) vencido(s) — RC.LD.03`, action: () => setView("rcld03") });
    if (stats.insSoon > 0) a.push({ type: "warning", msg: `${stats.insSoon} insumo(s) vencen en <45 días`, action: () => setView("rcld03") });
    if (stats.persVenc > 0) a.push({ type: "danger", msg: `${stats.persVenc} autorización(es) vencida(s) — RC.LD.02`, action: () => setView("rcld02") });
    if (stats.persSoon > 0) a.push({ type: "warning", msg: `${stats.persSoon} autorización(es) vence(n) pronto`, action: () => setView("rcld02") });
    if (stats.pendientes > 0) a.push({ type: "info", msg: `${stats.pendientes} registro(s) pendiente(s) de verificación`, action: () => setView("rcld01") });
    return a;
  }, [stats, setView]);

  const recentActivity = useMemo(() => {
    return [...records]
      .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""))
      .slice(0, 4)
      .map((r) => ({
        id: r.id,
        area: r.area,
        estado: r.estado,
        fecha: r.fecha,
      }));
  }, [records]);

  const kpis = [
    { label: "Total Registros", val: stats.total, cls: "kpi-total", onClick: () => setView("rcld01") },
    { label: "Aprobados", val: stats.aprobados, cls: "kpi-approved", onClick: () => setView("rcld01") },
    { label: "Pend. Verificación", val: stats.pendientes, cls: "kpi-pending", onClick: () => setView("rcld01") },
    { label: "Rechazados", val: stats.rechazados, cls: "kpi-rejected", onClick: () => setView("rcld01") },
  ];

  return (
    <div className="page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Limpieza y Desinfección — Planta Beneficiadora INGAMA, Riberalta</p>
        </div>
        <div className="page-header-badges">
          <span className="badge badge-primary">FSSC 22000 v6</span>
          <div className="kpi-compliance">
            <svg width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border-color)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-success)" strokeWidth="3"
                strokeDasharray={`${stats.cumplimiento * 0.942} 100`} strokeLinecap="round"
                transform="rotate(-90 18 18)" style={{ transition: "stroke-dasharray 0.6s ease" }} />
            </svg>
            <span className="kpi-compliance-value">{stats.cumplimiento}%</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-grid">
          {alerts.map((a, i) => (
            <button key={i} className={`alert-card alert-${a.type}`} onClick={a.action}>
              <span className="alert-dot" />
              <span className="alert-msg">{a.msg}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 3l4 4-4 4"/></svg>
            </button>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid">
        {kpis.map((k, i) => (
          <button key={i} className={`kpi-card ${k.cls}`} onClick={k.onClick}>
            <span className="kpi-label">{k.label}</span>
            <span className="kpi-value">{k.val}</span>
            <span className="kpi-period">RC.LD.01 · Actual</span>
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="dashboard-charts">
        <div className="card">
          <h3 className="card-title">Cumplimiento por Área (%)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={areaData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="area" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} />
              <Tooltip
                formatter={(v) => `${v}%`}
                contentStyle={{ borderRadius: 8, border: "1px solid var(--border-color)", fontSize: 12 }}
              />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]} fill="url(#barGradient)">
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" />
                    <stop offset="100%" stopColor="var(--color-primary-dark)" />
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="card-title">Estado de Registros</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                dataKey="value"
                paddingAngle={3}
                strokeWidth={0}
              >
                {pieData.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border-color)", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {pieData.map((e, i) => (
              <span key={i} className="chart-legend-item">
                <span className="chart-legend-dot" style={{ background: e.color }} />
                {e.name}: {e.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="dashboard-bottom">
        {/* Summary cards */}
        <div className="card">
          <h3 className="card-title">Personal (RC.LD.02)</h3>
          <div className="summary-list">
            {[
              { label: "Autorizado", count: personnel.filter((p) => p.estado === "autorizado").length, cls: "status-approved" },
              { label: "Pendiente", count: personnel.filter((p) => p.estado === "pendiente").length, cls: "status-pending" },
              { label: "Suspendido/Vencido", count: personnel.filter((p) => p.estado === "suspendido" || isExpired(p.vigencia)).length, cls: "status-rejected" },
            ].map((s, i) => (
              <div key={i} className={`summary-item ${s.cls}`}>
                <span>{s.label}</span>
                <span className="summary-count">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Insumos (RC.LD.03)</h3>
          <div className="summary-list">
            {[
              { label: "Aprobado", count: supplies.filter((s) => s.estado === "aprobado").length, cls: "status-approved" },
              { label: "Condicionado", count: supplies.filter((s) => s.estado === "condicionado").length, cls: "status-pending" },
              { label: "Rechazado/Vencido", count: supplies.filter((s) => s.estado === "rechazado" || isExpired(s.venc)).length, cls: "status-rejected" },
            ].map((s, i) => (
              <div key={i} className={`summary-item ${s.cls}`}>
                <span>{s.label}</span>
                <span className="summary-count">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Actividad Reciente</h3>
          <div className="activity-list">
            {recentActivity.map((r, i) => (
              <div key={i} className="activity-item">
                <span className={`activity-dot status-dot-${r.estado}`} />
                <div className="activity-info">
                  <span className="activity-area">{r.area}</span>
                  <span className="activity-id">{r.id}</span>
                </div>
                <span className="activity-date">{r.fecha}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
