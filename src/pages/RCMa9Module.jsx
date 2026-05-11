import { useState, useCallback, useMemo } from "react";
import { AREAS } from "../data/initial";
import { fmtDate, newRecordId, todayISO } from "../helpers";
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
        (!filter.search || r.id.toLowerCase().includes(filter.search.toLowerCase()) || r.punto.toLowerCase().includes(filter.search.toLowerCase()))
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

  const canCreate = user.role === "admin" || user.role === "control" || user.role === "seguimiento";

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">RC.MA.9 — Control de Hisopado</h1>
          <p className="page-subtitle">Superficies y Manos ATP · FSSC 22000</p>
        </div>
        {canCreate && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={() => window.print()}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 5V3h8v2M4 11H2V6h12v5h-2M4 9h8v4H4z"/></svg>
              Imprimir
            </button>
            <button className="btn btn-primary" onClick={onNew}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>
              Nuevo Registro
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="input-wrapper input-search">
          <svg className="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="5" /><path d="M14 14l-3.5-3.5" />
          </svg>
          <input className="form-input" placeholder="Buscar código o punto..." value={filter.search} onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))} />
        </div>
        <select className="form-select" value={filter.area} onChange={(e) => setFilter((f) => ({ ...f, area: e.target.value }))}>
          <option value="">Todas las áreas</option>
          {AREAS.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select className="form-select" value={filter.estado} onChange={(e) => setFilter((f) => ({ ...f, estado: e.target.value }))}>
          <option value="">Todos los estados</option>
          <option value="conforme">Conforme</option>
          <option value="no_conforme">No conforme</option>
        </select>
        <span className="filters-count">{filtered.length} registro(s)</span>
      </div>

      {/* Elemento solo visible en impresión */}
      <div className="print-only">
         <div className="print-header">
            <img src="/logo.png" alt="Logo INGAMA" className="print-logo" />
            <div>
              <h2>RC.MA.9 REGISTRO CONTROL DE HISOPADO ATP</h2>
              <p>FSSC 22000 v6 / ISO/TS 22002-1</p>
            </div>
         </div>
      </div>

      {/* Table */}
      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              {[
                { key: "id", label: "Código" },
                { key: "fecha", label: "Fecha" },
                { key: "area", label: "Área Evaluada" },
                { key: "punto", label: "Punto de Hisopado" },
                { key: "tipo", label: "Tipo" },
                { key: "resultado", label: "Resultado URL" },
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
                <p>No se encontraron registros</p>
              </td></tr>
            ) : filtered.map((r) => {
              return (
                <tr key={r.id} className="table-row-hover" onClick={() => onDetail(r)}>
                  <td className="td-mono">{r.id}</td>
                  <td>{fmtDate(r.fecha)}</td>
                  <td className="td-bold">{r.area}</td>
                  <td>{r.punto}</td>
                  <td>{r.tipo === 'manos' ? 'Manos' : 'Superficie'}</td>
                  <td className="td-bold">{r.resultado}</td>
                  <td>
                    <span className={`badge ${r.estado === "conforme" ? "badge-success" : "badge-danger"}`}>
                      {r.estado === "conforme" ? "Conforme" : "No Conforme"}
                    </span>
                  </td>
                  <td>
                    <button className="btn-link" onClick={(e) => { e.stopPropagation(); onDetail(r); }}>
                      Ver
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
    id: record?.id || newRecordId(allRecords, "RC.MA.9"),
    fecha: record?.fecha || todayISO(),
    area: record?.area || AREAS[0],
    punto: record?.punto || "",
    tipo: record?.tipo || "superficie",
    responsable: record?.responsable || user.name,
    resultado: record?.resultado || "",
    limite: record?.limite || "< 50 URL",
    estado: record?.estado || "conforme",
    accion: record?.accion || "",
    obs: record?.obs || "",
    firma: record?.firma || false,
  });

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const saveAndSign = () => {
    if (!form.punto || !form.resultado) {
      toast.warning("Complete el punto de hisopado y el resultado.");
      return;
    }
    onSave({ ...form, firma: true });
    toast.success("Registro de hisopado guardado correctamente.");
  };

  return (
    <div className="page animate-fade-in">
      <div className="page-back-header">
        <button className="btn btn-ghost" onClick={onCancel}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 3L5 8l5 5"/></svg>
          Volver
        </button>
        <div>
          <h1 className="page-title">{isNew ? "Nuevo Hisopado" : "Editar Hisopado"} — RC.MA.9</h1>
        </div>
      </div>

      <div className="form-sections">
        <div className="card">
          <h3 className="card-title">Información del Hisopado</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Fecha de Evaluación *</label>
              <input type="date" value={form.fecha} onChange={(e) => upd("fecha", e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Responsable de Hisopado *</label>
              <input value={form.responsable} onChange={(e) => upd("responsable", e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Área Evaluada *</label>
              <select value={form.area} onChange={(e) => upd("area", e.target.value)} className="form-select">
                {AREAS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tipo de Análisis *</label>
              <select value={form.tipo} onChange={(e) => upd("tipo", e.target.value)} className="form-select">
                <option value="superficie">Superficie</option>
                <option value="manos">Manos (Personal)</option>
              </select>
            </div>
            <div className="form-group form-group-full">
              <label className="form-label">Punto específico de hisopado (Nombre del equipo o persona) *</label>
              <input value={form.punto} onChange={(e) => upd("punto", e.target.value)} className="form-input" placeholder="Ej. Mesón principal de acero inoxidable" />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Resultados (ATP)</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Resultado Obtenido (URL) *</label>
              <input value={form.resultado} onChange={(e) => upd("resultado", e.target.value)} className="form-input" placeholder="Ej. 15" />
            </div>
            <div className="form-group">
              <label className="form-label">Límite Permitido</label>
              <input value={form.limite} onChange={(e) => upd("limite", e.target.value)} className="form-input" />
            </div>
          </div>
          
          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label className="form-label">Estado de Conformidad *</label>
            <div className="radio-group">
              {[["conforme", "✓ Conforme", "radio-success"], ["no_conforme", "✗ No conforme", "radio-danger"]].map(([v, l, cls]) => (
                <label key={v} className={`radio-card ${cls} ${form.estado === v ? "selected" : ""}`}>
                  <input type="radio" name="estado" value={v} checked={form.estado === v} onChange={(e) => upd("estado", e.target.value)} />
                  <span>{l}</span>
                </label>
              ))}
            </div>
          </div>

          {form.estado === "no_conforme" && (
            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label className="form-label">Acción correctiva inmediata *</label>
              <textarea value={form.accion} onChange={(e) => upd("accion", e.target.value)} rows={2} className="form-textarea" placeholder="Describa el re-lavado, re-desinfección u otra acción..." />
            </div>
          )}

          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label className="form-label">Observaciones Adicionales</label>
            <textarea value={form.obs} onChange={(e) => upd("obs", e.target.value)} rows={2} className="form-textarea" />
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Firma del Evaluador</h3>
          <SigCanvas label="Firma" signed={form.firma} signerName={form.responsable} canSign={!form.firma} onSign={() => upd("firma", true)} />
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" onClick={saveAndSign}>Guardar Registro</button>
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
