import { useState, useMemo } from "react";
import { ITEMS_AREA, FRECUENCIAS, MOMENTOS } from "../../../data/initial";
import { getAreaConfig } from "../../../data/areasConfig";
import { fmtDate } from "../../../helpers";
import StatusBadge from "../../../components/StatusBadge";
import SignatureBox from "../../../components/SigCanvas";
import { exportRC_LD01 } from "../../../utils/exportXlsx";

// Normaliza campo cumple legacy (bool) → string
function normCumple(val) {
  if (val === true) return "√";
  if (val === false || val === undefined || val === null) return "";
  return val;
}

export default function RecordDetail({ record, user, onUpdate, onBack, toast }) {
  const areaConfig = useMemo(() => getAreaConfig(record.area), [record.area]);
  const currentItems = useMemo(() => ITEMS_AREA[record.area] || [], [record.area]);
  const canSeg = user.role === "seguimiento" || user.role === "admin";
  const pendingSeg = record.estado === "firmado_control";

  // Estado local para la acción correctiva del seguimiento.
  // IMPORTANTE: El Resp. de Seguimiento NO puede modificar los datos base
  // (área, fecha, ítems, frecuencia, resultado original del control).
  // Solo puede actuar sobre: resultado de verificación, acción correctiva y firma.
  const [segForm, setSegForm] = useState({
    accionCorrectiva: record.accionCorrectivaSeg || "",
    resultadoVerif: record.resultadoVerif || record.resultado || "",
  });

  // Detecta si el Seguimiento cambió el resultado original del Control
  const resultadoOriginal = record.resultado || "";
  const resultadoCambiado = segForm.resultadoVerif && segForm.resultadoVerif !== resultadoOriginal;

  // Compute compliance stats (√ = cumple)
  const stats = useMemo(() => {
    let total = currentItems.length;
    let checked = 0;
    currentItems.forEach(it => {
      if (normCumple(record.items?.[it]?.cumple) === "√") checked++;
    });
    return { total, checked, pct: total > 0 ? Math.round((checked / total) * 100) : 0 };
  }, [currentItems, record.items]);

  const freqLabel = (code) => FRECUENCIAS.find(f => f.code === code)?.label || code;
  const momentLabel = (code) => MOMENTOS.find(m => m.code === code)?.short || code;
  const freqColor = (code) => FRECUENCIAS.find(f => f.code === code)?.color || "#94a3b8";

  // ── ACCIONES DEL RESPONSABLE DE SEGUIMIENTO ────────────────────────
  const handleSign = (sig) => {
    const cambio = {
      quién: user.name,
      rol: "seguimiento",
      fechaHora: new Date().toISOString(),
      tipo: "firma",
      detalle: `Firmado como Resp. de Seguimiento (${sig.tipo === "canvas" ? "manuscrita" : "rápida"})`,
    };
    onUpdate({
      ...record,
      firmaSeg: sig,
      accionCorrectivaSeg: segForm.accionCorrectiva,
      resultadoVerif: segForm.resultadoVerif,
      historialCambios: [...(record.historialCambios || []), cambio],
    });
    toast?.success("Registro firmado como Responsable de Seguimiento.");
  };

  const buildCambioResultado = (tipoAccion) => {
    if (!resultadoCambiado) return null;
    return {
      quién: user.name,
      rol: "seguimiento",
      fechaHora: new Date().toISOString(),
      tipo: "cambio_resultado",
      detalle: `Resultado modificado por verificación: "${resultadoOriginal || "—"}" → "${segForm.resultadoVerif}". Acción: ${tipoAccion}. Justificación/Acción correctiva: ${segForm.accionCorrectiva || "—"}`,
    };
  };

  const handleApprove = () => {
    const sig = {
      firmado: true,
      nombre: user.name,
      rol: user.role,
      fechaHora: new Date().toISOString(),
      tipo: "digital",
    };
    const cambios = [];
    const cambioRes = buildCambioResultado("aprobación");
    if (cambioRes) cambios.push(cambioRes);
    cambios.push({
      quién: user.name,
      rol: "seguimiento",
      fechaHora: new Date().toISOString(),
      tipo: "aprobacion",
      detalle: `Verificado y aprobado. Resultado final: ${segForm.resultadoVerif}. Acción correctiva: ${segForm.accionCorrectiva || "Ninguna"}`,
    });
    onUpdate({
      ...record,
      estado: "aprobado",
      firmaSeg: sig,
      accionCorrectivaSeg: segForm.accionCorrectiva,
      resultadoVerif: segForm.resultadoVerif,
      historialCambios: [...(record.historialCambios || []), ...cambios],
    });
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
    const cambios = [];
    const cambioRes = buildCambioResultado("rechazo");
    if (cambioRes) cambios.push(cambioRes);
    cambios.push({
      quién: user.name,
      rol: "seguimiento",
      fechaHora: new Date().toISOString(),
      tipo: "rechazo",
      detalle: `Rechazado. Resultado verificación: ${segForm.resultadoVerif}. Acción correctiva: ${segForm.accionCorrectiva || "Ninguna"}`,
    });
    onUpdate({
      ...record,
      estado: "rechazado",
      firmaSeg: sig,
      accionCorrectivaSeg: segForm.accionCorrectiva,
      resultadoVerif: segForm.resultadoVerif,
      historialCambios: [...(record.historialCambios || []), ...cambios],
    });
    toast?.warning("Registro rechazado. Se notificará al responsable de control.");
  };

  const handleDownloadOfficial = async () => {
    try {
      await exportRC_LD01(record, currentItems);
      toast?.success("Excel oficial descargado. Ábralo en Excel/LibreOffice y use Archivo → Imprimir → Guardar como PDF.");
    } catch (e) {
      toast?.error("Error al generar Excel oficial: " + e.message);
    }
  };

  const fmtHora = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" }) +
      " " + d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
  };

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
        <button
          className="btn btn-primary"
          onClick={handleDownloadOfficial}
          style={{ marginLeft: 8 }}
          title="Descargar Excel (formato OFICIAL idéntico al RC.LD.01). Abra el archivo en Excel/LibreOffice y use 'Imprimir → Guardar como PDF' para obtener el PDF oficial."
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 1h7l3 3v11H3V1z M10 1v3h3"/>
          </svg>
          Descargar Excel Oficial RC.LD.01
        </button>
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
            <span className="detail-label">Resultado Control</span>
            <span className={`detail-value ${record.resultado === "conforme" ? "text-success" : record.resultado === "no_conforme" ? "text-danger" : ""}`}>
              {record.resultado === "conforme" ? "✓ Conforme" : record.resultado === "no_conforme" ? "✗ No conforme" : "—"}
            </span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Liberación</span>
            <span className="detail-value">{record.liberacion === "si" ? "✓ Liberada" : record.liberacion === "no" ? "✗ No liberada" : "N/A"}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Cumplimiento Ítems</span>
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
                <th style={{ width: 110 }} className="td-center">Frecuencia</th>
                <th style={{ width: 80 }} className="td-center">Momento</th>
                <th style={{ width: 90 }} className="td-center">Calificación</th>
                <th>Acción Correctiva</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((it, i) => {
                const val = record.items?.[it] || {};
                const cumple = normCumple(val.cumple);
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
                      {cumple === "√" ? (
                        <span className="text-success" style={{ fontWeight: 700, fontSize: 18 }}>√</span>
                      ) : cumple === "x" ? (
                        <span className="text-danger" style={{ fontWeight: 700, fontSize: 18 }}>x</span>
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

      {/* ─── REGISTRO DE ENVÍO DEL RESPONSABLE DE CONTROL ─── */}
      {/* La firma digital del Responsable de Control fue eliminada por requerimiento. */}
      {/* Solo se conserva la trazabilidad del envío (nombre + fecha/hora). */}
      <div className="card">
        <h3 className="card-title">Registro del Responsable de Control</h3>
        {record.enviadoCtrl?.fechaHora || record.firmaCtrl?.firmado ? (
          <div style={{ padding: "12px 0", display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div className="detail-field">
              <span className="detail-label">Completado por</span>
              <span className="detail-value">{record.enviadoCtrl?.nombre || record.firmaCtrl?.nombre || record.respControl}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Fecha / Hora envío</span>
              <span className="detail-value">{fmtHora(record.enviadoCtrl?.fechaHora || record.firmaCtrl?.fechaHora)}</span>
            </div>
          </div>
        ) : (
          <p className="text-muted" style={{ fontSize: 13 }}>Aún no enviado a verificación por el Responsable de Control.</p>
        )}
      </div>

      {/* ─── SECCIÓN DE VERIFICACIÓN DEL SEGUIMIENTO ──────────── */}
      {canSeg && pendingSeg && (
        <div className="card card-warning">
          <h3 className="card-title">Verificación — Responsable de Seguimiento</h3>
          <div className="info-banner info-warning" style={{ marginBottom: 16, fontSize: 12 }}>
            <strong>Restricción:</strong> No puede modificar área, fecha, ítems, frecuencia ni datos llenados por el Responsable de Control. Solo puede registrar el resultado de verificación, la acción correctiva, firmar y, si corresponde, cambiar el resultado de la limpieza con trazabilidad.
          </div>

          {/* Aviso si está cambiando el resultado original */}
          {resultadoCambiado && (
            <div className="info-banner info-primary" style={{ marginBottom: 12, fontSize: 12 }}>
              <strong>Atención:</strong> Está cambiando el resultado original "
              {resultadoOriginal === "conforme" ? "Conforme" : resultadoOriginal === "no_conforme" ? "No conforme" : "—"}
              " → "
              {segForm.resultadoVerif === "conforme" ? "Conforme" : "No conforme"}".
              El cambio quedará registrado con trazabilidad (quién, fecha, hora y justificación) al confirmar.
            </div>
          )}

          {/* Resultado de verificación */}
          <div className="form-group">
            <label className="form-label">Resultado de la verificación *</label>
            <div className="radio-group radio-group-sm">
              {[
                ["conforme", "✓ Conforme — Limpieza correcta", "radio-success"],
                ["no_conforme", "✗ No conforme — Requiere corrección", "radio-danger"],
              ].map(([v, l, cls]) => (
                <label key={v} className={`radio-card ${cls} ${segForm.resultadoVerif === v ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="resultadoVerif"
                    value={v}
                    checked={segForm.resultadoVerif === v}
                    onChange={(e) => setSegForm(f => ({ ...f, resultadoVerif: e.target.value }))}
                  />
                  <span>{l}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Acción correctiva */}
          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">
              Acción Correctiva del Seguimiento
              {segForm.resultadoVerif === "no_conforme" && <span style={{ color: "var(--color-danger)" }}> *</span>}
            </label>
            <textarea
              value={segForm.accionCorrectiva}
              onChange={(e) => setSegForm(f => ({ ...f, accionCorrectiva: e.target.value }))}
              rows={3}
              className="form-textarea"
              placeholder={
                segForm.resultadoVerif === "no_conforme"
                  ? "Describa la acción correctiva solicitada o aplicada..."
                  : "Observaciones o acciones complementarias (opcional)..."
              }
            />
          </div>

          {/* Firma del Seguimiento */}
          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label" style={{ marginBottom: 8, display: "block" }}>Firma del Responsable de Seguimiento</label>
            <SignatureBox
              label="Firma Responsable Seguimiento"
              signature={record.firmaSeg}
              signerName={record.respSeg || user.name}
              signerRole="seguimiento"
              canSign={!record.firmaSeg?.firmado}
              onSign={handleSign}
            />
          </div>

          {/* Botones de decisión */}
          <div className="form-actions" style={{ marginTop: 16 }}>
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

      {/* ─── FIRMA DEL SEGUIMIENTO (ya firmado) ────────────────── */}
      {record.firmaSeg?.firmado && (
        <div className="card">
          <h3 className="card-title">Firma del Responsable de Seguimiento</h3>
          <SignatureBox
            label="Firma Responsable Seguimiento"
            signature={record.firmaSeg}
            signerName={record.respSeg}
            canSign={false}
          />
          {record.accionCorrectivaSeg && (
            <div style={{ marginTop: 12 }}>
              <span className="detail-label">Acción correctiva del Seguimiento:</span>
              <p className="detail-value" style={{ marginTop: 4 }}>{record.accionCorrectivaSeg}</p>
            </div>
          )}
          {record.resultadoVerif && (
            <div style={{ marginTop: 8 }}>
              <span className="detail-label">Resultado verificación:</span>
              <span className={`detail-value ${record.resultadoVerif === "conforme" ? "text-success" : "text-danger"}`} style={{ marginLeft: 8 }}>
                {record.resultadoVerif === "conforme" ? "✓ Conforme" : "✗ No conforme"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ─── HISTORIAL DE CAMBIOS ───────────────────────────────── */}
      {record.historialCambios && record.historialCambios.length > 0 && (
        <div className="card">
          <h3 className="card-title">Historial de Trazabilidad</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {record.historialCambios.map((c, i) => (
              <div key={i} className="info-banner info-primary" style={{ margin: 0, fontSize: 12 }}>
                <strong>{fmtHora(c.fechaHora)}</strong> · {c.quién} ({c.rol}) · {c.detalle}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
