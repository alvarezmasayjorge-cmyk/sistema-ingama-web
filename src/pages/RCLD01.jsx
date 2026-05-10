import { useState, useCallback, useMemo } from "react";
import { AREAS, ITEMS_AREA, STATUS } from "../data/initial";
import { fmtDate, newRecordId, todayISO, getCurrentMonth } from "../helpers";
import SigCanvas from "../components/SigCanvas";

// ─── LIST VIEW ─────────────────────────────────────────────────────────────────
function RecordList({ records, user, onNew, onDetail }) {
  const [filter, setFilter] = useState({ area: "", estado: "", search: "" });
  const [sortKey, setSortKey] = useState("fecha");
  const [sortDir, setSortDir] = useState("desc");

  const filtered = useMemo(() => {
    let result = records.filter(
      (r) =>
        (!filter.area || r.area === filter.area) &&
        (!filter.estado || r.estado === filter.estado) &&
        (!filter.search || r.id.toLowerCase().includes(filter.search.toLowerCase()) || r.area.toLowerCase().includes(filter.search.toLowerCase()) || r.respControl.toLowerCase().includes(filter.search.toLowerCase()))
    );
    result.sort((a, b) => {
      const va = a[sortKey] || "";
      const vb = b[sortKey] || "";
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return result;
  }, [records, filter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const canCreate = user.role === "admin" || user.role === "control";

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">RC.LD.01 — Limpieza y Desinfección</h1>
          <p className="page-subtitle">Rev. 03 · Vigencia 2026</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={onNew}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>
            Nuevo Registro
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="input-wrapper input-search">
          <svg className="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="5" /><path d="M14 14l-3.5-3.5" />
          </svg>
          <input className="form-input" placeholder="Buscar código, área o responsable..." value={filter.search} onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))} />
        </div>
        <select className="form-select" value={filter.area} onChange={(e) => setFilter((f) => ({ ...f, area: e.target.value }))}>
          <option value="">Todas las áreas</option>
          {AREAS.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select className="form-select" value={filter.estado} onChange={(e) => setFilter((f) => ({ ...f, estado: e.target.value }))}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="filters-count">{filtered.length} registro(s)</span>
      </div>

      {/* Table */}
      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              {[
                { key: "id", label: "Código" },
                { key: "area", label: "Área" },
                { key: "fecha", label: "Fecha" },
                { key: "respControl", label: "Resp. Control" },
                { key: "resultado", label: "Resultado" },
                { key: "liberacion", label: "Liberación" },
                { key: "estado", label: "Estado" },
                { key: null, label: "" },
              ].map((col) => (
                <th key={col.label || "action"} onClick={col.key ? () => toggleSort(col.key) : undefined} className={col.key ? "sortable" : ""}>
                  {col.label}
                  {col.key && sortKey === col.key && <span className="sort-arrow">{sortDir === "asc" ? "↑" : "↓"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="8" className="table-empty">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--text-quaternary)" strokeWidth="1.5" strokeLinecap="round"><circle cx="24" cy="24" r="20"/><path d="M16 28s2 4 8 4 8-4 8-4"/><circle cx="18" cy="20" r="1.5" fill="var(--text-quaternary)"/><circle cx="30" cy="20" r="1.5" fill="var(--text-quaternary)"/></svg>
                <p>No se encontraron registros</p>
              </td></tr>
            ) : filtered.map((r) => {
              const st = STATUS[r.estado];
              return (
                <tr key={r.id} className="table-row-hover" onClick={() => onDetail(r)}>
                  <td className="td-mono">{r.id}</td>
                  <td className="td-bold">{r.area}</td>
                  <td>{fmtDate(r.fecha)}</td>
                  <td>{r.respControl}</td>
                  <td>
                    {r.resultado ? (
                      <span className={`badge ${r.resultado === "conforme" ? "badge-success" : "badge-danger"}`}>
                        {r.resultado === "conforme" ? "Conforme" : "No conforme"}
                      </span>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td>
                    {r.liberacion ? (
                      <span className={r.liberacion === "si" ? "text-success" : r.liberacion === "no" ? "text-danger" : "text-muted"}>
                        {r.liberacion === "si" ? "✓ Liberado" : r.liberacion === "no" ? "✗ No liberado" : "N/A"}
                      </span>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td>
                    <span className={`status-badge ${st.cls}`}>
                      <span className="status-dot" />
                      {st.label}
                    </span>
                  </td>
                  <td>
                    <button className="btn-link" onClick={(e) => { e.stopPropagation(); onDetail(r); }}>
                      Ver
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 2l4 4-4 4"/></svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── FORM VIEW ─────────────────────────────────────────────────────────────────
function RecordForm({ record, user, onSave, onCancel, allRecords, toast }) {
  const isNew = !record;
  const [form, setForm] = useState({
    id: record?.id || newRecordId(allRecords),
    area: record?.area || "Recepción MP",
    mes: record?.mes || getCurrentMonth(),
    respControl: record?.respControl || user.name,
    respSeg: record?.respSeg || "Rosa Vaca Méndez",
    fecha: record?.fecha || todayISO(),
    resultado: record?.resultado || "",
    correccion: record?.correccion || "",
    liberacion: record?.liberacion || "",
    firmaCtrl: record?.firmaCtrl || false,
    firmaSeg: false,
    obs: record?.obs || "",
    estado: record?.estado || "borrador",
    items: {},
  });

  const [errors, setErrors] = useState({});
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const canCtrl = user.role === "control" || user.role === "admin";

  const validate = () => {
    const e = {};
    if (!form.resultado) e.resultado = true;
    if (!form.liberacion) e.liberacion = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveAndSign = () => {
    if (!validate()) {
      toast.warning("Complete todos los campos requeridos antes de firmar.");
      return;
    }
    onSave({ ...form, estado: "firmado_control", firmaCtrl: true });
    toast.success("Registro firmado y enviado a verificación.");
  };

  const saveDraft = () => {
    onSave({ ...form, estado: "borrador" });
    toast.info("Borrador guardado correctamente.");
  };

  const currentItems = ITEMS_AREA[form.area] || [];

  return (
    <div className="page animate-fade-in">
      <div className="page-back-header">
        <button className="btn btn-ghost" onClick={onCancel}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 3L5 8l5 5"/></svg>
          Volver
        </button>
        <div>
          <h1 className="page-title">{isNew ? "Nuevo Registro" : "Editar Registro"} — RC.LD.01</h1>
          <p className="page-subtitle">Código: {form.id} · Rev. 03 · INGAMA Riberalta</p>
        </div>
      </div>

      <div className="form-sections">
        {/* Header fields */}
        <div className="card">
          <h3 className="card-title">Información General</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Área *</label>
              <select value={form.area} onChange={(e) => upd("area", e.target.value)} disabled={!canCtrl} className="form-select">
                {AREAS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Mes *</label>
              <input value={form.mes} onChange={(e) => upd("mes", e.target.value)} disabled={!canCtrl} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de limpieza *</label>
              <input type="date" value={form.fecha} onChange={(e) => upd("fecha", e.target.value)} disabled={!canCtrl} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Responsable de Control</label>
              <input value={form.respControl} readOnly className="form-input form-input-readonly" />
            </div>
            <div className="form-group">
              <label className="form-label">Responsable de Seguimiento</label>
              <input value={form.respSeg} onChange={(e) => upd("respSeg", e.target.value)} disabled={!canCtrl} className="form-input" />
            </div>
          </div>
        </div>

        {/* Cleaning items */}
        <div className="card">
          <div className="card-title-row">
            <h3 className="card-title">Ítems de Limpieza — {form.area}</h3>
            <span className="badge badge-outline">{currentItems.length} ítems</span>
          </div>
          <div className="table-responsive">
            <table className="data-table data-table-compact">
              <thead>
                <tr>
                  {["Ítem", "Frecuencia", "Inicio", "Fin", "Mant.", "C. Proceso", "Reapertura"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentItems.map((it, i) => (
                  <tr key={it} className={i % 2 === 0 ? "" : "row-alt"}>
                    <td className="td-bold">{it}</td>
                    <td>
                      <select disabled={!canCtrl} className="form-select form-select-sm">
                        {["Diaria", "Semanal", "Quincenal", "Mensual"].map((f) => <option key={f}>{f}</option>)}
                      </select>
                    </td>
                    {["inicio", "fin", "mant", "cambio", "reap"].map((k) => (
                      <td key={k} className="td-center">
                        <input type="checkbox" disabled={!canCtrl} className="form-checkbox" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results */}
        <div className="card">
          <h3 className="card-title">Resultado Post-Limpieza</h3>
          <div className={`radio-group ${errors.resultado ? "radio-group-error" : ""}`}>
            {[["conforme", "✓ Conforme", "radio-success"], ["no_conforme", "✗ No conforme", "radio-danger"]].map(([v, l, cls]) => (
              <label key={v} className={`radio-card ${cls} ${form.resultado === v ? "selected" : ""}`}>
                <input type="radio" name="resultado" value={v} checked={form.resultado === v} onChange={(e) => { upd("resultado", e.target.value); setErrors((e2) => ({ ...e2, resultado: undefined })); }} disabled={!canCtrl} />
                <span>{l}</span>
              </label>
            ))}
          </div>
          {form.resultado === "no_conforme" && (
            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label className="form-label">Corrección inmediata realizada *</label>
              <textarea value={form.correccion} onChange={(e) => upd("correccion", e.target.value)} disabled={!canCtrl} rows={2} className="form-textarea" placeholder="Describa la corrección realizada..." />
            </div>
          )}
          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label className="form-label">Liberación pre-arranque *</label>
            <div className={`radio-group radio-group-sm ${errors.liberacion ? "radio-group-error" : ""}`}>
              {[["si", "✓ Sí — Área liberada", "radio-success"], ["no", "✗ No — No liberada", "radio-danger"], ["na", "— No aplica", "radio-neutral"]].map(([v, l, cls]) => (
                <label key={v} className={`radio-card ${cls} ${form.liberacion === v ? "selected" : ""}`}>
                  <input type="radio" name="liberacion" value={v} checked={form.liberacion === v} onChange={(e) => { upd("liberacion", e.target.value); setErrors((e2) => ({ ...e2, liberacion: undefined })); }} disabled={!canCtrl} />
                  <span>{l}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label className="form-label">Observaciones</label>
            <textarea value={form.obs} onChange={(e) => upd("obs", e.target.value)} disabled={!canCtrl} rows={2} className="form-textarea" />
          </div>
        </div>

        {/* Signatures */}
        <div className="card">
          <h3 className="card-title">Firmas Digitales</h3>
          <div className="form-grid-2">
            <div>
              <p className="form-label" style={{ marginBottom: 8 }}>Responsable de Control</p>
              <SigCanvas label="Firma Responsable Control" signed={form.firmaCtrl} signerName={form.respControl} canSign={canCtrl && !form.firmaCtrl} onSign={() => upd("firmaCtrl", true)} />
            </div>
            <div>
              <p className="form-label" style={{ marginBottom: 8 }}>Responsable de Seguimiento</p>
              <SigCanvas label="Firma Responsable Seguimiento" signed={form.firmaSeg} signerName={form.respSeg} canSign={false} onSign={() => upd("firmaSeg", true)} />
              <p className="form-hint">La firma de seguimiento se registra en la etapa de verificación.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {canCtrl && (
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
            <button className="btn btn-outline" onClick={saveDraft}>Guardar borrador</button>
            <button className="btn btn-primary" onClick={saveAndSign}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 7l3 3 5-5"/></svg>
              Guardar y Firmar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DETAIL VIEW ───────────────────────────────────────────────────────────────
function RecordDetail({ record, user, onUpdate, onBack, toast }) {
  const [obs, setObs] = useState(record.obs || "");
  const [signed, setSigned] = useState(record.firmaSeg || false);
  const canVerify = (user.role === "seguimiento" || user.role === "admin") && record.estado === "firmado_control";
  const st = STATUS[record.estado];

  const approve = () => {
    if (!signed) { toast.warning("Debe firmar antes de aprobar."); return; }
    onUpdate({ ...record, estado: "aprobado", firmaSeg: true, obs });
    toast.success("Registro aprobado y liberado exitosamente.");
  };

  const reject = () => {
    if (!signed) { toast.warning("Debe firmar antes de rechazar."); return; }
    onUpdate({ ...record, estado: "rechazado", firmaSeg: true, obs });
    toast.error("Registro rechazado. Se requiere nueva limpieza.");
  };

  const detailFields = [
    ["Área", record.area],
    ["Mes", record.mes],
    ["Fecha", fmtDate(record.fecha)],
    ["Resp. Control", record.respControl],
    ["Resp. Seguimiento", record.respSeg],
    ["Resultado", record.resultado === "conforme" ? "✓ Conforme" : record.resultado === "no_conforme" ? "✗ No conforme" : "—"],
    ["Liberación", record.liberacion === "si" ? "✓ Área liberada" : record.liberacion === "no" ? "✗ No liberada" : record.liberacion === "na" ? "N/A" : "—"],
    ["Firma Control", record.firmaCtrl ? "✓ Firmado" : "Pendiente"],
    ["Firma Seguimiento", record.firmaSeg ? "✓ Firmado" : "Pendiente"],
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-back-header">
        <button className="btn btn-ghost" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 3L5 8l5 5"/></svg>
          Volver
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h1 className="page-title">{record.id}</h1>
          <span className={`status-badge ${st.cls}`}>
            <span className="status-dot" />
            {st.label}
          </span>
        </div>
      </div>

      <div className="detail-grid">
        {detailFields.map(([l, v]) => (
          <div key={l} className="detail-field">
            <span className="detail-label">{l}</span>
            <span className="detail-value">{v}</span>
          </div>
        ))}
      </div>

      {record.correccion && (
        <div className="card card-warning">
          <h4 className="card-title">Corrección inmediata registrada</h4>
          <p>{record.correccion}</p>
        </div>
      )}

      {canVerify && (
        <div className="card">
          <h3 className="card-title">Verificación / Seguimiento</h3>
          <div className="form-group">
            <label className="form-label">Observaciones de verificación</label>
            <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3} className="form-textarea" placeholder="Registre observaciones de la verificación..." />
          </div>
          <div className="form-group">
            <p className="form-label" style={{ marginBottom: 8 }}>Firma del Responsable de Seguimiento</p>
            <SigCanvas label="Firma Seguimiento" signed={signed} signerName={user.name} canSign={!signed} onSign={() => setSigned(true)} />
          </div>
          <div className="form-actions-split">
            <button className="btn btn-outline-danger" onClick={reject}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg>
              Rechazar
            </button>
            <button className="btn btn-success" onClick={approve}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 7l3 3 5-5"/></svg>
              Aprobar y Liberar
            </button>
          </div>
        </div>
      )}

      {!canVerify && (
        <div className={`info-banner ${record.estado === "aprobado" ? "info-success" : record.estado === "rechazado" ? "info-danger" : "info-neutral"}`}>
          {record.estado === "aprobado" && <p>✓ Registro aprobado y cerrado. Solo el administrador puede reabrir dejando trazabilidad.</p>}
          {record.estado === "rechazado" && <p>✗ Registro rechazado. Requiere nueva ejecución de limpieza.</p>}
          {record.estado === "borrador" && <p>Registro en borrador. El responsable de control debe completar y firmar.</p>}
          {record.estado === "firmado_control" && user.role === "control" && <p>Enviado a verificación. El responsable de seguimiento debe revisar y aprobar.</p>}
        </div>
      )}
    </div>
  );
}

// ─── MAIN RCLD01 ───────────────────────────────────────────────────────────────
export default function RCLD01({ records, setRecords, user, toast }) {
  const [sub, setSub] = useState("list");
  const [sel, setSel] = useState(null);

  const openNew = useCallback(() => { setSel(null); setSub("form"); }, []);
  const openDetail = useCallback((r) => { setSel(r); setSub("detail"); }, []);
  const backToList = useCallback(() => setSub("list"), []);

  const handleSave = useCallback((r) => {
    setRecords((prev) => (sel ? prev.map((x) => (x.id === r.id ? r : x)) : [...prev, r]));
    setSub("list");
  }, [sel, setRecords]);

  const handleUpdate = useCallback((r) => {
    setRecords((prev) => prev.map((x) => (x.id === r.id ? r : x)));
    setSub("list");
  }, [setRecords]);

  if (sub === "form") return <RecordForm record={sel} user={user} onSave={handleSave} onCancel={backToList} allRecords={records} toast={toast} />;
  if (sub === "detail" && sel) return <RecordDetail record={sel} user={user} onUpdate={handleUpdate} onBack={backToList} toast={toast} />;
  return <RecordList records={records} user={user} onNew={openNew} onDetail={openDetail} />;
}
