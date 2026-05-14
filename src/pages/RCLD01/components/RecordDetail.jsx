import { useMemo } from "react";
import { ITEMS_AREA, FRECUENCIAS, MOMENTOS } from "../../../data/initial";
import { getAreaConfig } from "../../../data/areasConfig";
import { fmtDate } from "../../../helpers";
import StatusBadge from "../../../components/StatusBadge";
import SignatureBox from "../../../components/SigCanvas";

export default function RecordDetail({ record, user, onUpdate, onBack, toast }) {
  const areaConfig = useMemo(() => getAreaConfig(record.area), [record.area]);
  const currentItems = useMemo(() => ITEMS_AREA[record.area] || [], [record.area]);
  const canSeg = user.role === "seguimiento" || user.role === "admin";
  const pendingSeg = record.estado === "firmado_control";

  // Compute compliance stats
  const stats = useMemo(() => {
    let total = currentItems.length;
    let checked = 0;
    currentItems.forEach(it => {
      if (record.items?.[it]?.cumple) checked++;
    });
    return { total, checked, pct: total > 0 ? Math.round((checked / total) * 100) : 0 };
  }, [currentItems, record.items]);

  const handleApprove = () => {
    const sig = {
      firmado: true,
      nombre: user.name,
      rol: user.role,
      fechaHora: new Date().toISOString(),
      tipo: "digital",
    };
    onUpdate({ ...record, estado: "aprobado", firmaSeg: sig });
    toast?.success("Registro aprobado y verificado.");
  };

  const handleReject = () => {
    const sig = {
      firmado: true,
      nombre: user.name,
      rol: user.role,
      fechaHora: new Date().toISOString(),
      tipo: "digital",
    };
    onUpdate({ ...record, estado: "rechazado", firmaSeg: sig });
    toast?.warning("Registro rechazado. Se notificará al responsable de control.");
  };

  const freqLabel = (code) => FRECUENCIAS.find(f => f.code === code)?.label || code;
  const momentLabel = (code) => MOMENTOS.find(m => m.code === code)?.short || code;
  const freqColor = (code) => FRECUENCIAS.find(f => f.code === code)?.color || "#94a3b8";

  return (
    <div className="page animate-fade-in">
      <div className="page-back-header">
        <button className="btn btn-ghost" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 3L5 8l5 5"/></svg>
          Volver
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">Detalle del Registro — RC.LD.01</h1>
          <p className="page-subtitle">
            {record.id} · {areaConfig?.registro || ""} · Rev. 03
          </p>
        </div>
        <StatusBadge status={record.estado} />
      </div>

      {/* ─── INFO GENERAL ──────────────────────────────────────── */}
      <div className="card">
        <h3 className="card-title">Información General</h3>
        <div className="detail-grid">
          <div className="detail-field">
            <span className="detail-label">Área</span>
            <span className="detail-value">{record.area}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Mes</span>
            <span className="detail-value">{record.mes}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Fecha</span>
            <span className="detail-value">{fmtDate(record.fecha)}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Resp. Control</span>
            <span className="detail-value">{record.respControl}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Resp. Seguimiento</span>
            <span className="detail-value">{record.respSeg || "—"}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Resultado</span>
            <span className={`detail-value ${record.resultado === "conforme" ? "text-success" : record.resultado === "no_conforme" ? "text-danger" : ""}`}>
              {record.resultado === "conforme" ? "✓ Conforme" : record.resultado === "no_conforme" ? "✗ No conforme" : "—"}
            </span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Liberación</span>
            <span className="detail-value">{record.liberacion === "si" ? "✓ Liberada" : record.liberacion === "no" ? "✗ No liberada" : "N/A"}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Cumplimiento</span>
            <span className={`detail-value ${stats.pct === 100 ? "text-success" : "text-warning"}`}>
              {stats.checked}/{stats.total} ({stats.pct}%)
            </span>
          </div>
        </div>
        {record.correccion && (
          <div style={{ marginTop: 12 }}>
            <span className="detail-label">Corrección realizada:</span>
            <p className="detail-value" style={{ marginTop: 4 }}>{record.correccion}</p>
          </div>
        )}
        {record.obs && (
          <div style={{ marginTop: 12 }}>
            <span className="detail-label">Observaciones:</span>
            <p className="detail-value" style={{ marginTop: 4 }}>{record.obs}</p>
          </div>
        )}
      </div>

      {/* ─── ÍTEMS ─────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title-row">
          <h3 className="card-title">Ítems de Limpieza y Desinfección</h3>
          <span className="badge badge-outline">{currentItems.length} ítems</span>
        </div>
        <div className="table-responsive">
          <table className="data-table data-table-compact">
            <thead>
              <tr>
                <th style={{ width: 50 }}>Nro</th>
                <th>Ítem</th>
                <th style={{ width: 90 }} className="td-center">Frecuencia</th>
                <th style={{ width: 80 }} className="td-center">Momento</th>
                <th style={{ width: 80 }} className="td-center">Cumple</th>
                <th>Acción Correctiva</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((it, i) => {
                const val = record.items?.[it] || {};
                return (
                  <tr key={it} className={i % 2 === 0 ? "" : "row-alt"}>
                    <td className="td-center text-muted">{i + 1}</td>
                    <td className="td-bold">{it}</td>
                    <td className="td-center">
                      <span className="badge badge-sm" style={{ background: freqColor(val.freq) + "20", color: freqColor(val.freq), border: `1px solid ${freqColor(val.freq)}40` }}>
                        {val.freq || "D"} — {freqLabel(val.freq || "D")}
                      </span>
                    </td>
                    <td className="td-center">
                      <span className="text-muted">{momentLabel(val.momento || "F")}</span>
                    </td>
                    <td className="td-center">
                      {val.cumple ? (
                        <span className="text-success" style={{ fontWeight: 700, fontSize: 16 }}>✓</span>
                      ) : (
                        <span className="text-muted" style={{ fontSize: 14 }}>—</span>
                      )}
                    </td>
                    <td className="text-muted">{val.accion || "—"}</td>
                    <td className="text-muted">{val.obs || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── FIRMAS ────────────────────────────────────────────── */}
      <div className="card">
        <h3 className="card-title">Firmas Digitales</h3>
        <div className="form-grid-2">
          <div>
            <p className="form-label" style={{ marginBottom: 8 }}>Responsable de Control</p>
            <SignatureBox
              label="Firma Responsable Control"
              signature={record.firmaCtrl}
              signerName={record.respControl}
              canSign={false}
            />
          </div>
          <div>
            <p className="form-label" style={{ marginBottom: 8 }}>Responsable de Seguimiento</p>
            <SignatureBox
              label="Firma Responsable Seguimiento"
              signature={record.firmaSeg}
              signerName={record.respSeg}
              signerRole={user.role}
              canSign={canSeg && pendingSeg && !record.firmaSeg?.firmado}
              onSign={(sig) => onUpdate({ ...record, firmaSeg: sig })}
            />
          </div>
        </div>
      </div>

      {/* ─── ACCIONES DE VERIFICACIÓN ──────────────────────────── */}
      {canSeg && pendingSeg && (
        <div className="card card-warning">
          <h3 className="card-title">Verificación Pendiente</h3>
          <p style={{ marginBottom: 16, fontSize: 13 }}>
            Este registro fue firmado por el Responsable de Control y está pendiente de su verificación.
          </p>
          <div className="form-actions">
            <button className="btn btn-danger" onClick={handleReject}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg>
              Rechazar
            </button>
            <button className="btn btn-success" onClick={handleApprove}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 7l3 3 5-5"/></svg>
              Aprobar y Verificar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
