import { useState, useCallback, useMemo } from "react";
import { AREAS } from "../data/initial";
import { fmtDate, todayISO, newRcma9Id } from "../helpers";
import SignatureBox from "../components/SigCanvas";
import PrintHeader from "../components/PrintHeader";

/**
 * RC.MA.09 — CONTROL DE HISOPADO DE MANOS Y SUPERFICIE ATP
 * Columnas reales del Excel Rev.01:
 * Fecha | Tipo (Superficie/Manos) | Área o Sector | Identificación Superficie
 * | Resultado (RLU) | Unidad (RLU) | Límite Min (100) | Límite Max (500)
 * | Clasificación: Pasa / Precaución / No Pasa | Corrección
 */

const LIMITES = { min: 100, max: 500, unidad: "RLU" };

const clasificarResultado = (valor) => {
  const n = parseFloat(valor);
  if (isNaN(n)) return "—";
  if (n <= LIMITES.min) return "pasa";
  if (n <= LIMITES.max) return "precaucion";
  return "no_pasa";
};

const CLASIFICACION_LABELS = {
  pasa: { label: "Pasa", cls: "badge-success", icon: "✓" },
  precaucion: { label: "Precaución", cls: "badge-warning", icon: "⚠" },
  no_pasa: { label: "No Pasa", cls: "badge-danger", icon: "✗" },
  "—": { label: "—", cls: "badge-outline", icon: "—" },
};

// ─── LIST VIEW ─────────────────────────────────────────────────────────────────
function RecordList({ records, user, onNew, onDetail }) {
  const [filter, setFilter] = useState({ area: "", tipo: "", clasif: "", search: "" });

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const clasif = clasificarResultado(r.resultado);
      return (
        (!filter.area || r.area === filter.area) &&
        (!filter.tipo || r.tipo === filter.tipo) &&
        (!filter.clasif || clasif === filter.clasif) &&
        (!filter.search ||
          r.id.toLowerCase().includes(filter.search.toLowerCase()) ||
          (r.identificacion || r.punto || "").toLowerCase().includes(filter.search.toLowerCase()) ||
          r.area.toLowerCase().includes(filter.search.toLowerCase()))
      );
    });
  }, [records, filter]);

  const stats = useMemo(() => {
    let pasa = 0, precaucion = 0, noPasa = 0;
    records.forEach(r => {
      const c = clasificarResultado(r.resultado);
      if (c === "pasa") pasa++;
      else if (c === "precaucion") precaucion++;
      else if (c === "no_pasa") noPasa++;
    });
    return { total: records.length, pasa, precaucion, noPasa };
  }, [records]);

  const canCreate = user.role === "admin" || user.role === "control" || user.role === "seguimiento";

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">RC.MA.09 — Control de Hisopado ATP</h1>
          <p className="page-subtitle">Manos y Superficies · Rev. 01 · Vigente 04-01-25 · {records.length} muestreo(s)</p>
        </div>
        {canCreate && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={() => window.print()}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 5V3h8v2M4 11H2V6h12v5h-2M4 9h8v4H4z"/></svg>
              Imprimir
            </button>
            <button className="btn btn-primary" onClick={onNew}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>
              Nuevo Muestreo
            </button>
          </div>
        )}
      </div>

      <PrintHeader docCode="RC.MA.09" />

      {/* Stats */}
      <div className="stats-row" style={{ marginBottom: 16 }}>
        {[
          { label: "Total", value: stats.total, color: "var(--color-primary)" },
          { label: "Pasa (≤100 RLU)", value: stats.pasa, color: "var(--color-success)" },
          { label: "Precaución (101-500)", value: stats.precaucion, color: "var(--color-warning)" },
          { label: "No Pasa (>500 RLU)", value: stats.noPasa, color: "var(--color-danger)" },
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
            <circle cx="6.5" cy="6.5" r="5" /><path d="M14 14l-3.5-3.5" />
          </svg>
          <input className="form-input" placeholder="Buscar código, punto o área..." value={filter.search} onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))} />
        </div>
        <select className="form-select" value={filter.area} onChange={(e) => setFilter((f) => ({ ...f, area: e.target.value }))} style={{ maxWidth: 250 }}>
          <option value="">Todas las áreas</option>
          {AREAS.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select className="form-select" value={filter.tipo} onChange={(e) => setFilter((f) => ({ ...f, tipo: e.target.value }))} style={{ maxWidth: 150 }}>
          <option value="">Todos los tipos</option>
          <option value="superficie">Superficie</option>
          <option value="manos">Manos</option>
        </select>
        <select className="form-select" value={filter.clasif} onChange={(e) => setFilter((f) => ({ ...f, clasif: e.target.value }))} style={{ maxWidth: 160 }}>
          <option value="">Toda clasificación</option>
          <option value="pasa">✓ Pasa</option>
          <option value="precaucion">⚠ Precaución</option>
          <option value="no_pasa">✗ No Pasa</option>
        </select>
      </div>

      {/* Table */}
      <div className="card table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Área o Sector</th>
                <th>Identificación Superficie</th>
                <th className="td-center">Resultado (RLU)</th>
                <th className="td-center">Límite Min</th>
                <th className="td-center">Límite Max</th>
                <th className="td-center">Clasificación</th>
                <th>Corrección</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} className="td-empty"><p>No se encontraron muestreos</p></td></tr>
              ) : filtered.map((r) => {
                const clasif = clasificarResultado(r.resultado);
                const info = CLASIFICACION_LABELS[clasif];
                return (
                  <tr key={r.id} className={`table-row-clickable ${clasif === "no_pasa" ? "row-danger" : clasif === "precaucion" ? "row-warning" : ""}`} onClick={() => onDetail(r)}>
                    <td className="td-mono">{r.id}</td>
                    <td>{fmtDate(r.fecha)}</td>
                    <td>
                      <span className={`badge ${r.tipo === "manos" ? "badge-primary" : "badge-outline"}`}>
                        {r.tipo === "manos" ? "Manos" : "Superficie"}
                      </span>
                    </td>
                    <td className="td-bold" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.area}</td>
                    <td className="td-small">{r.identificacion || r.punto || "—"}</td>
                    <td className="td-center td-bold" style={{ fontSize: 14 }}>{r.resultado || "—"}</td>
                    <td className="td-center text-muted">{LIMITES.min}</td>
                    <td className="td-center text-muted">{LIMITES.max}</td>
                    <td className="td-center">
                      <span className={`badge ${info.cls}`}>{info.icon} {info.label}</span>
                    </td>
                    <td className="td-small">{r.correccion || r.accion || "—"}</td>
                    <td className="td-center">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"><path d="M5 3l4 4-4 4"/></svg>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reference */}
      <div className="info-banner info-primary">
        <strong>Criterios ATP (Luminómetro):</strong> ≤100 RLU = <strong style={{color:"#059669"}}>Pasa</strong> · 101–500 RLU = <strong style={{color:"#d97706"}}>Precaución</strong> (repetir limpieza) · &gt;500 RLU = <strong style={{color:"#dc2626"}}>No Pasa</strong> (corrección inmediata obligatoria). Unidad: RLU (Relative Light Units).
      </div>
    </div>
  );
}

// ─── FORM VIEW ─────────────────────────────────────────────────────────────────
function RecordForm({ record, user, onSave, onCancel, allRecords, toast }) {
  const isNew = !record;
  const [form, setForm] = useState({
    id: record?.id || newRcma9Id(allRecords),
    fecha: record?.fecha || todayISO(),
    tipo: record?.tipo || "superficie",
    area: record?.area || AREAS[0],
    identificacion: record?.identificacion || record?.punto || "",
    resultado: record?.resultado || "",
    correccion: record?.correccion || record?.accion || "",
    obs: record?.obs || "",
    respControl: record?.respControl || user.name,
    respSeguimiento: record?.respSeguimiento || "",
    firmaCtrl: record?.firmaCtrl || null,
    firmaSeg: record?.firmaSeg || null,
  });

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const clasif = clasificarResultado(form.resultado);
  const clasifInfo = CLASIFICACION_LABELS[clasif];

  const saveRecord = () => {
    if (!form.identificacion || !form.resultado) {
      toast?.warning("Complete la identificación y el resultado del muestreo.");
      return;
    }
    const signData = {
      firmado: true,
      nombre: user.name,
      rol: user.role,
      fechaHora: new Date().toISOString(),
      tipo: "digital",
    };
    onSave({ ...form, firmaCtrl: signData });
    toast?.success("Registro de hisopado guardado correctamente.");
  };

  return (
    <div className="page animate-fade-in">
      <div className="page-back-header">
        <button className="btn btn-ghost" onClick={onCancel}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 3L5 8l5 5"/></svg>
          Volver
        </button>
        <div>
          <h1 className="page-title">{isNew ? "Nuevo Muestreo" : "Editar Muestreo"} — RC.MA.09</h1>
          <p className="page-subtitle">Control de Hisopado de Manos y Superficie ATP</p>
        </div>
      </div>

      <div className="form-sections">
        {/* Información del muestreo */}
        <div className="card">
          <h3 className="card-title">Información del Muestreo</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Fecha *</label>
              <input type="date" value={form.fecha} onChange={(e) => upd("fecha", e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo *</label>
              <div className="radio-group">
                {[["superficie", "Superficie"], ["manos", "Manos"]].map(([v, l]) => (
                  <label key={v} className={`radio-card ${form.tipo === v ? "selected" : ""} ${v === "superficie" ? "radio-neutral" : "radio-success"}`}>
                    <input type="radio" name="tipo" value={v} checked={form.tipo === v} onChange={(e) => upd("tipo", e.target.value)} />
                    <span>{l}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Área o Sector *</label>
              <select value={form.area} onChange={(e) => upd("area", e.target.value)} className="form-select">
                {AREAS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Responsable del Control</label>
              <input value={form.respControl} onChange={(e) => upd("respControl", e.target.value)} className="form-input" />
            </div>
            <div className="form-group form-group-full">
              <label className="form-label">Identificación Superficie / Persona *</label>
              <input value={form.identificacion} onChange={(e) => upd("identificacion", e.target.value)} className="form-input" placeholder={form.tipo === "manos" ? "Nombre del operario evaluado" : "Ej: Mesa de acero inoxidable - Seleccionado"} />
            </div>
          </div>
        </div>

        {/* Resultados ATP */}
        <div className="card">
          <h3 className="card-title">Resultados ATP</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Resultado Obtenido (RLU) *</label>
              <input type="number" value={form.resultado} onChange={(e) => upd("resultado", e.target.value)} className="form-input" placeholder="Ingrese valor en RLU" style={{ fontSize: 18, fontWeight: 700 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Clasificación Automática</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", border: `2px solid ${clasif === "pasa" ? "#10b981" : clasif === "precaucion" ? "#f59e0b" : clasif === "no_pasa" ? "#ef4444" : "#e2e8f0"}`, borderRadius: "var(--radius-sm)", background: clasif === "pasa" ? "#ecfdf5" : clasif === "precaucion" ? "#fffbeb" : clasif === "no_pasa" ? "#fef2f2" : "var(--border-light)" }}>
                <span style={{ fontSize: 20 }}>{clasifInfo.icon}</span>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{clasifInfo.label}</span>
                  <span style={{ display: "block", fontSize: 10, color: "var(--text-tertiary)" }}>
                    Límites: {LIMITES.min}–{LIMITES.max} {LIMITES.unidad}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Corrección si no pasa */}
          {(clasif === "no_pasa" || clasif === "precaucion") && (
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Corrección {clasif === "no_pasa" ? "(Obligatoria)" : "(Recomendada)"} *</label>
              <textarea value={form.correccion} onChange={(e) => upd("correccion", e.target.value)} rows={2} className="form-textarea" placeholder="Describa la acción correctiva: re-lavado, re-desinfección, re-muestreo..." />
            </div>
          )}

          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Observaciones</label>
            <textarea value={form.obs} onChange={(e) => upd("obs", e.target.value)} rows={2} className="form-textarea" />
          </div>
        </div>

        {/* Firmas */}
        <div className="card">
          <h3 className="card-title">Firmas</h3>
          <div className="form-grid-2">
            <div>
              <p className="form-label" style={{ marginBottom: 8 }}>Responsable del Control</p>
              <SignatureBox
                label="Firma Responsable Control"
                signature={form.firmaCtrl}
                signerName={form.respControl}
                signerRole={user.role}
                canSign={!form.firmaCtrl?.firmado}
                onSign={(sig) => upd("firmaCtrl", sig)}
              />
            </div>
            <div>
              <p className="form-label" style={{ marginBottom: 8 }}>Responsable de Seguimiento</p>
              <SignatureBox
                label="Firma Responsable Seguimiento"
                signature={form.firmaSeg}
                signerName={form.respSeguimiento || "Pendiente"}
                signerRole="seguimiento"
                canSign={false}
                onSign={(sig) => upd("firmaSeg", sig)}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" onClick={saveRecord}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 7l3 3 5-5"/></svg>
            Guardar Muestreo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN MODULE ───────────────────────────────────────────────────────────────
export default function RCMa9Module({ records, setRecords, user, toast }) {
  const [sub, setSub] = useState("list");
  const [sel, setSel] = useState(null);

  const openNew = useCallback(() => { setSel(null); setSub("form"); }, []);
  const openDetail = useCallback((r) => { setSel(r); setSub("form"); }, []);
  const backToList = useCallback(() => setSub("list"), []);

  const handleSave = useCallback((r) => {
    setRecords((prev) => (sel ? prev.map((x) => (x.id === r.id ? r : x)) : [...prev, r]));
    setSub("list");
  }, [sel, setRecords]);

  if (sub === "form") return <RecordForm record={sel} user={user} onSave={handleSave} onCancel={backToList} allRecords={records} toast={toast} />;
  return <RecordList records={records} user={user} onNew={openNew} onDetail={openDetail} />;
}
