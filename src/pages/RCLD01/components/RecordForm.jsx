import { useState, useMemo } from "react";
import { AREAS, ITEMS_AREA, FRECUENCIAS, MOMENTOS } from "../../../data/initial";
import { getAreaConfig } from "../../../data/areasConfig";
import { newRecordId, todayISO, getCurrentMonth } from "../../../helpers";
import { validateRecord, hasErrors } from "../../../validators";

// Default frequencies per item
const DEFAULT_FREQ = "D";
const DEFAULT_MOMENT = "F";

// Helper: normaliza campo cumple (bool legacy → string nuevo)
function normCumple(val) {
  if (val === true) return "√";
  if (val === false || val === undefined || val === null) return "";
  return val; // ya es "√", "x" o ""
}

export default function RecordForm({ record, user, onSave, onCancel, allRecords, personnel, toast }) {
  const isNew = !record;

  const [form, setForm] = useState(() => {
    // Normalizar ítems del registro si vienen del formato antiguo (bool)
    const rawItems = record?.items || {};
    const normItems = {};
    Object.keys(rawItems).forEach(k => {
      normItems[k] = { ...rawItems[k], cumple: normCumple(rawItems[k]?.cumple) };
    });

    return {
      id: record?.id || newRecordId(allRecords),
      area: record?.area || AREAS[0],
      mes: record?.mes || getCurrentMonth(),
      respControl: record?.respControl || user.name,
      respSeg: record?.respSeg || "",
      fecha: record?.fecha || todayISO(),
      resultado: record?.resultado || "",
      correccion: record?.correccion || "",
      liberacion: record?.liberacion || "",
      // Nota: La firma del Responsable de Control fue eliminada por requerimiento.
      // Solo el Responsable de Seguimiento firma el registro.
      firmaSeg: record?.firmaSeg || null,
      obs: record?.obs || "",
      estado: record?.estado || "borrador",
      items: normItems,
      historialCambios: record?.historialCambios || [],
    };
  });

  const [errors, setErrors] = useState({});
  const areaConfig = useMemo(() => getAreaConfig(form.area), [form.area]);
  const currentItems = useMemo(() => ITEMS_AREA[form.area] || [], [form.area]);

  const upd = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const updItem = (it, k, v) => {
    setForm((f) => ({
      ...f,
      items: {
        ...f.items,
        [it]: { ...(f.items[it] || { freq: DEFAULT_FREQ, momento: DEFAULT_MOMENT, cumple: "", accion: "", obs: "" }), [k]: v },
      },
    }));
  };

  const canCtrl = user.role === "control" || user.role === "admin";

  const validate = (forSign = false) => {
    const e = validateRecord(form, allRecords, {
      personnel: personnel || [],
      requireSign: forSign,
      isNew: !record,
    });
    setErrors(e);
    return !hasErrors(e);
  };

  const saveAndSign = () => {
    if (!validate(true)) {
      toast?.warning("Complete y corrija los campos marcados antes de enviar a verificación.");
      return;
    }
    // El Responsable de Control NO firma digitalmente. Solo se registra
    // su nombre y la fecha/hora en que envió el registro a verificación.
    const cambio = {
      quién: user.name,
      rol: "control",
      fechaHora: new Date().toISOString(),
      tipo: "envio",
      detalle: `Registro completado por ${user.name} y enviado a verificación del Resp. de Seguimiento.`,
    };
    onSave({
      ...form,
      estado: "firmado_control",
      enviadoCtrl: { nombre: user.name, fechaHora: new Date().toISOString() },
      historialCambios: [...(form.historialCambios || []), cambio],
    });
    toast?.success("Registro enviado a verificación del Responsable de Seguimiento.");
  };

  const saveDraft = () => {
    if (!validate(false)) {
      toast?.warning("Revise los campos marcados en rojo");
      return;
    }
    onSave({ ...form, estado: "borrador" });
    toast?.info("Borrador guardado correctamente.");
  };

  // Count compliance (√ = cumple)
  const itemStats = useMemo(() => {
    let total = currentItems.length;
    let checked = 0;
    currentItems.forEach((it) => {
      if (form.items[it]?.cumple === "√") checked++;
    });
    return { total, checked, pct: total > 0 ? Math.round((checked / total) * 100) : 0 };
  }, [currentItems, form.items]);

  // Personnel list for dropdowns
  const personnelNames = useMemo(() => {
    if (!personnel || !personnel.length) return [];
    return personnel.filter(p => p.estado === "autorizado").map(p => p.nombre);
  }, [personnel]);

  return (
    <div className="page animate-fade-in">
      <div className="page-back-header">
        <button className="btn btn-ghost" onClick={onCancel}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 3L5 8l5 5"/></svg>
          Volver
        </button>
        <div>
          <h1 className="page-title">{isNew ? "Nuevo Registro" : "Editar Registro"} — RC.LD.01</h1>
          <p className="page-subtitle">
            Código: {form.id} · Rev. 03 · {areaConfig ? `Registro ${areaConfig.registro}` : ""}
          </p>
        </div>
      </div>

      <div className="form-sections">
        {/* ─── INFORMACIÓN GENERAL ─────────────────────────── */}
        <div className="card">
          <h3 className="card-title">Información General</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Área *</label>
              <select
                value={form.area}
                onChange={(e) => upd("area", e.target.value)}
                disabled={!canCtrl}
                className={`form-select ${errors.area ? "form-input-error" : ""}`}
              >
                {AREAS.map((a, i) => (
                  <option key={a} value={a}>
                    {i + 1}. {a}
                  </option>
                ))}
              </select>
              {errors.area && <span className="form-error-msg">{errors.area}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Mes *</label>
              <input
                value={form.mes}
                onChange={(e) => upd("mes", e.target.value)}
                disabled={!canCtrl}
                className={`form-input ${errors.mes ? "form-input-error" : ""}`}
              />
              {errors.mes && <span className="form-error-msg">{errors.mes}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de limpieza *</label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => upd("fecha", e.target.value)}
                disabled={!canCtrl}
                className={`form-input ${errors.fecha ? "form-input-error" : ""}`}
              />
              {errors.fecha && <span className="form-error-msg">{errors.fecha}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Responsable de Control *</label>
              {personnelNames.length > 0 ? (
                <select
                  value={form.respControl}
                  onChange={(e) => upd("respControl", e.target.value)}
                  disabled={!canCtrl}
                  className={`form-select ${errors.respControl ? "form-input-error" : ""}`}
                >
                  <option value={user.name}>{user.name}</option>
                  {personnelNames.filter(n => n !== user.name).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              ) : (
                <input value={form.respControl} readOnly className="form-input form-input-readonly" />
              )}
              {errors.respControl && <span className="form-error-msg">{errors.respControl}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Responsable de Seguimiento *</label>
              {personnelNames.length > 0 ? (
                <select
                  value={form.respSeg}
                  onChange={(e) => upd("respSeg", e.target.value)}
                  disabled={!canCtrl}
                  className={`form-select ${errors.respSeg ? "form-input-error" : ""}`}
                >
                  <option value="">Seleccione...</option>
                  {personnelNames.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={form.respSeg}
                  onChange={(e) => upd("respSeg", e.target.value)}
                  disabled={!canCtrl}
                  className={`form-input ${errors.respSeg ? "form-input-error" : ""}`}
                />
              )}
              {errors.respSeg && <span className="form-error-msg">{errors.respSeg}</span>}
            </div>
          </div>
        </div>

        {/* ─── ÍTEMS DE LIMPIEZA CON FRECUENCIA Y MOMENTO ───── */}
        <div className="card">
          <div className="card-title-row">
            <h3 className="card-title">
              Ítems de Limpieza y Desinfección — {form.area}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="badge badge-outline">{currentItems.length} ítems</span>
              <span className={`badge ${itemStats.pct === 100 ? "badge-success" : itemStats.pct > 0 ? "badge-warning" : "badge-neutral"}`}>
                {itemStats.checked}/{itemStats.total} ({itemStats.pct}%)
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="progress-bar-container" style={{ marginBottom: 16 }}>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${itemStats.pct}%`,
                  background: itemStats.pct === 100 ? "var(--color-success)" : "var(--color-primary)",
                }}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table data-table-compact">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>Nro</th>
                  <th>Ítem de Limpieza</th>
                  <th style={{ width: 110 }} className="td-center">Frecuencia</th>
                  <th style={{ width: 90 }} className="td-center">Momento</th>
                  <th style={{ width: 90 }} className="td-center">Calificación</th>
                  <th style={{ width: 160 }}>Acción Correctiva</th>
                  <th style={{ width: 140 }}>Observación</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((it, i) => {
                  const val = form.items[it] || {};
                  const freq = val.freq || DEFAULT_FREQ;
                  const freqInfo = FRECUENCIAS.find(f => f.code === freq);
                  const cumple = normCumple(val.cumple);
                  return (
                    <tr key={it} className={i % 2 === 0 ? "" : "row-alt"}>
                      <td className="td-center text-muted">{i + 1}</td>
                      <td className="td-bold">{it}</td>
                      <td className="td-center">
                        <select
                          value={freq}
                          onChange={(e) => updItem(it, "freq", e.target.value)}
                          disabled={!canCtrl}
                          className="form-select form-select-sm"
                          style={{ minWidth: 55, borderColor: freqInfo?.color || "var(--border-color)" }}
                        >
                          {FRECUENCIAS.map((f) => (
                            <option key={f.code} value={f.code}>
                              {f.code}
                            </option>
                          ))}
                        </select>
                        <span className="text-muted" style={{ fontSize: 10, display: "block" }}>
                          {freqInfo?.label || freq}
                        </span>
                      </td>
                      <td className="td-center">
                        <select
                          value={val.momento || DEFAULT_MOMENT}
                          onChange={(e) => updItem(it, "momento", e.target.value)}
                          disabled={!canCtrl}
                          className="form-select form-select-sm"
                          style={{ minWidth: 60 }}
                        >
                          {MOMENTOS.map((m) => (
                            <option key={m.code} value={m.code}>
                              {m.code} — {m.short}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="td-center">
                        <select
                          value={cumple}
                          onChange={(e) => updItem(it, "cumple", e.target.value)}
                          disabled={!canCtrl}
                          className="form-select form-select-sm"
                          style={{
                            minWidth: 60,
                            fontWeight: 700,
                            fontSize: 16,
                            color: cumple === "√" ? "var(--color-success)" : cumple === "x" ? "var(--color-danger)" : "var(--text-secondary)",
                            textAlign: "center",
                          }}
                        >
                          <option value="">—</option>
                          <option value="√">√</option>
                          <option value="x">x</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          disabled={!canCtrl}
                          className="form-input form-input-sm"
                          value={val.accion || ""}
                          onChange={(e) => updItem(it, "accion", e.target.value)}
                          placeholder={cumple === "x" ? "Requerida..." : "Opcional"}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          disabled={!canCtrl}
                          className="form-input form-input-sm"
                          value={val.obs || ""}
                          onChange={(e) => updItem(it, "obs", e.target.value)}
                          placeholder="—"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── RESULTADO POST-LIMPIEZA ─────────────────────────── */}
        <div className="card">
          <h3 className="card-title">Resultado Post-Limpieza</h3>
          <div className={`radio-group ${errors.resultado ? "radio-group-error" : ""}`}>
            {[
              ["conforme", "✓ Conforme", "radio-success"],
              ["no_conforme", "✗ No conforme", "radio-danger"],
            ].map(([v, l, cls]) => (
              <label key={v} className={`radio-card ${cls} ${form.resultado === v ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="resultado"
                  value={v}
                  checked={form.resultado === v}
                  onChange={(e) => upd("resultado", e.target.value)}
                  disabled={!canCtrl}
                />
                <span>{l}</span>
              </label>
            ))}
          </div>
          {errors.resultado && <span className="form-error-msg">{errors.resultado}</span>}

          {form.resultado === "no_conforme" && (
            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label className="form-label">Corrección inmediata realizada *</label>
              <textarea
                value={form.correccion}
                onChange={(e) => upd("correccion", e.target.value)}
                disabled={!canCtrl}
                rows={2}
                className={`form-textarea ${errors.correccion ? "form-input-error" : ""}`}
                placeholder="Describa la corrección realizada..."
              />
              {errors.correccion && <span className="form-error-msg">{errors.correccion}</span>}
            </div>
          )}

          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label className="form-label">Liberación pre-arranque *</label>
            <div className={`radio-group radio-group-sm ${errors.liberacion ? "radio-group-error" : ""}`}>
              {[
                ["si", "✓ Sí — Área liberada", "radio-success"],
                ["no", "✗ No — No liberada", "radio-danger"],
                ["na", "— No aplica", "radio-neutral"],
              ].map(([v, l, cls]) => (
                <label key={v} className={`radio-card ${cls} ${form.liberacion === v ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="liberacion"
                    value={v}
                    checked={form.liberacion === v}
                    onChange={(e) => upd("liberacion", e.target.value)}
                    disabled={!canCtrl}
                  />
                  <span>{l}</span>
                </label>
              ))}
            </div>
            {errors.liberacion && <span className="form-error-msg">{errors.liberacion}</span>}
          </div>

          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label className="form-label">Observaciones</label>
            <textarea
              value={form.obs}
              onChange={(e) => upd("obs", e.target.value)}
              disabled={!canCtrl}
              rows={2}
              className="form-textarea"
              placeholder="Observaciones generales del registro..."
            />
          </div>
        </div>

        {/* ─── ACCIONES ────────────────────────────────────────── */}
        {canCtrl && (
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
            <button className="btn btn-outline" onClick={saveDraft}>Guardar borrador</button>
            <button className="btn btn-primary" onClick={saveAndSign}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 7l3 3 5-5" />
              </svg>
              Guardar y Enviar a Verificación
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
