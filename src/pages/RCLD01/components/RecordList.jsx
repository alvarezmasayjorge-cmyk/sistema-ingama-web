import { useState, useMemo } from "react";
import { AREAS } from "../../../data/initial";
import { fmtDate } from "../../../helpers";
import StatusBadge from "../../../components/StatusBadge";
import { exportRC_LD01 } from "../../../utils/exportXlsx";

const STATUS_FILTER = [
  { value: "", label: "Todos" },
  { value: "borrador", label: "Borrador" },
  { value: "firmado_control", label: "Pend. Verificación" },
  { value: "aprobado", label: "Aprobado" },
  { value: "rechazado", label: "Rechazado" },
];

export default function RecordList({ records, user, onNew, onDetail }) {
  const [search, setSearch] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const canCtrl = user.role === "control" || user.role === "admin";

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterArea && r.area !== filterArea) return false;
      if (filterStatus && r.estado !== filterStatus) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          r.id.toLowerCase().includes(s) ||
          r.area.toLowerCase().includes(s) ||
          r.respControl.toLowerCase().includes(s) ||
          r.mes.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [records, filterArea, filterStatus, search]);

  // Stats
  const stats = useMemo(() => ({
    total: records.length,
    borrador: records.filter(r => r.estado === "borrador").length,
    pendiente: records.filter(r => r.estado === "firmado_control").length,
    aprobado: records.filter(r => r.estado === "aprobado").length,
    rechazado: records.filter(r => r.estado === "rechazado").length,
  }), [records]);

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">RC.LD.01 — Limpieza y Desinfección</h1>
          <p className="page-subtitle">Registro de Limpieza y Desinfección · Rev. 03 · {records.length} registros</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {canCtrl && (
            <button className="btn btn-primary" onClick={onNew}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 1v12M1 7h12"/></svg>
              Nuevo Registro
            </button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="stats-row" style={{ marginBottom: 16 }}>
        {[
          { label: "Total", value: stats.total, color: "var(--color-primary)" },
          { label: "Borrador", value: stats.borrador, color: "var(--text-tertiary)" },
          { label: "Pendiente", value: stats.pendiente, color: "var(--color-warning)" },
          { label: "Aprobados", value: stats.aprobado, color: "var(--color-success)" },
          { label: "Rechazados", value: stats.rechazado, color: "var(--color-danger)" },
        ].map(s => (
          <div key={s.label} className="stat-mini" style={{ borderLeft: `3px solid ${s.color}` }}>
            <span className="stat-mini-value">{s.value}</span>
            <span className="stat-mini-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="input-wrapper" style={{ flex: 1, maxWidth: 300 }}>
          <svg className="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="7" cy="7" r="5.5" /><path d="M11.5 11.5L15 15" />
          </svg>
          <input
            className="form-input"
            placeholder="Buscar por ID, área, responsable..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="form-select" value={filterArea} onChange={(e) => setFilterArea(e.target.value)} style={{ maxWidth: 280 }}>
          <option value="">Todas las áreas ({AREAS.length})</option>
          {AREAS.map((a, i) => (
            <option key={a} value={a}>{i + 1}. {a}</option>
          ))}
        </select>
        <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ maxWidth: 180 }}>
          {STATUS_FILTER.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Área</th>
                <th>Mes</th>
                <th>Fecha</th>
                <th>Resp. Control</th>
                <th className="td-center">Estado</th>
                <th className="td-center">Resultado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="td-empty">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
                      <circle cx="20" cy="20" r="18" strokeDasharray="4 2" />
                      <path d="M14 26c0-4 3-6 6-6s6 2 6 6" strokeLinecap="round" />
                      <circle cx="16" cy="16" r="2" />
                      <circle cx="24" cy="16" r="2" />
                    </svg>
                    <p>No se encontraron registros</p>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="table-row-clickable" onClick={() => onDetail(r)}>
                    <td className="td-mono">{r.id}</td>
                    <td className="td-bold" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.area}</td>
                    <td>{r.mes}</td>
                    <td>{fmtDate(r.fecha)}</td>
                    <td>{r.respControl}</td>
                    <td className="td-center"><StatusBadge status={r.estado} /></td>
                    <td className="td-center">
                      {r.resultado === "conforme" ? (
                        <span className="text-success" style={{ fontWeight: 600 }}>✓</span>
                      ) : r.resultado === "no_conforme" ? (
                        <span className="text-danger" style={{ fontWeight: 600 }}>✗</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="td-center">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3">
                        <path d="M5 3l4 4-4 4" />
                      </svg>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
