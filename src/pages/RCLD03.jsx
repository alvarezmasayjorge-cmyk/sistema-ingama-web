import { useState, useMemo, useCallback } from "react";
import { fmtDate, isExpired, isSoon, newSupplyId, newSupplyCode } from "../helpers";
import { validateSupply, hasErrors } from "../validators";
import PrintHeader from "../components/PrintHeader";
import { exportRC_LD03 } from "../utils/exportXlsx";

/**
 * RC.LD.03 — LISTADO DE INSUMOS DE LIMPIEZA Y DESINFECCIÓN
 * Columnas reales del Excel Rev.03 (actualizado 09/05/2026):
 * Código del Insumo | Nombre del Insumo | Descripción/Presentación | Unidad de Medida
 * | Proveedor | Ubicación | Uso autorizado en planta | Ingrediente activo/componente principal
 * | Concentración comercial | Apto industria alimentaria/superficies contacto
 * | Superficie/aplicación autorizada | Ficha técnica | MSDS | Lote/referencia recepción
 * | Fecha de vencimiento/caducidad | Estado técnico | Registro de recepción/evidencia | Observaciones
 */

const EMPTY_SUPPLY = {
  codigo: "", nombre: "", descripcion: "", unidad: "Litros",
  proveedor: "", ubicacion: "Lavandería de recipientes de área blanca y almacenamiento de materiales de insumos",
  usoAutorizado: "", ingrediente: "", concentracion: "",
  aptoAlimentaria: false, superficieAutorizada: "",
  ft: false, msds: false,
  lote: "", venc: "",
  estadoTecnico: "aprobado",
  registroRecepcion: "",
  observaciones: "",
};

const UNIDADES = ["Litros", "Kilos", "Galones", "Unidades", "Frascos", "Bidones"];

const ESTADO_OPTIONS = [
  { value: "aprobado", label: "Aprobado para uso definido" },
  { value: "condicionado", label: "Aprobado condicionado a documentación" },
  { value: "no_contacto", label: "Aprobado solo para uso no contacto directo" },
  { value: "rechazado", label: "Rechazado" },
];

function SupplyForm({ supply, onSave, onCancel, allSupplies, toast }) {
  const isNew = !supply;
  const [form, setForm] = useState(supply || { ...EMPTY_SUPPLY, codigo: newSupplyCode(allSupplies) });
  const [errors, setErrors] = useState({});
  const upd = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const validate = () => {
    const e = validateSupply(form, allSupplies, {
      isNew,
      currentId: supply?.id || null,
    });
    setErrors(e);
    return !hasErrors(e);
  };

  const save = () => {
    if (!validate()) {
      toast?.warning("Revise los campos marcados en rojo");
      return;
    }
    onSave(form);
  };

  return (
    <div className="card animate-fade-in" style={{ maxWidth: 800 }}>
      <h3 className="card-title">{isNew ? "Agregar Insumo" : "Editar Insumo"}</h3>

      {/* Identificación */}
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Código del Insumo</label>
          <input className="form-input form-input-readonly" value={form.codigo} readOnly />
        </div>
        <div className="form-group">
          <label className="form-label">Nombre del Insumo *</label>
          <input className={`form-input ${errors.nombre ? "form-input-error" : ""}`} value={form.nombre} onChange={(e) => upd("nombre", e.target.value)} placeholder="Ej: Jabón Yodado" />
          {errors.nombre && <span className="form-error-msg">{errors.nombre}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Descripción / Presentación</label>
          <input className="form-input" value={form.descripcion} onChange={(e) => upd("descripcion", e.target.value)} placeholder="Ej: Líquido - Bidón" />
        </div>
        <div className="form-group">
          <label className="form-label">Unidad de Medida</label>
          <select className="form-select" value={form.unidad} onChange={(e) => upd("unidad", e.target.value)}>
            {UNIDADES.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Proveedor *</label>
          <input className={`form-input ${errors.proveedor ? "form-input-error" : ""}`} value={form.proveedor} onChange={(e) => upd("proveedor", e.target.value)} placeholder="Ej: Spartan" />
          {errors.proveedor && <span className="form-error-msg">{errors.proveedor}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Ubicación</label>
          <input className="form-input" value={form.ubicacion} onChange={(e) => upd("ubicacion", e.target.value)} />
        </div>
      </div>

      {/* Uso y composición */}
      <h3 className="card-title" style={{ marginTop: 20 }}>Composición y Uso</h3>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Uso autorizado en planta</label>
          <input className="form-input" value={form.usoAutorizado} onChange={(e) => upd("usoAutorizado", e.target.value)} placeholder="Ej: Lavado de manos del personal" />
        </div>
        <div className="form-group">
          <label className="form-label">Ingrediente activo / componente principal *</label>
          <input className={`form-input ${errors.ingrediente ? "form-input-error" : ""}`} value={form.ingrediente} onChange={(e) => upd("ingrediente", e.target.value)} placeholder="Ej: Ácido peracético" />
          {errors.ingrediente && <span className="form-error-msg">{errors.ingrediente}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Concentración comercial</label>
          <input className="form-input" value={form.concentracion} onChange={(e) => upd("concentracion", e.target.value)} placeholder="Ej: 13-17% declarado" />
        </div>
        <div className="form-group">
          <label className="form-label">Superficie / aplicación autorizada</label>
          <input className="form-input" value={form.superficieAutorizada} onChange={(e) => upd("superficieAutorizada", e.target.value)} placeholder="Ej: Lonas, mesas, recipientes" />
        </div>
      </div>

      {/* Documentación y trazabilidad */}
      <h3 className="card-title" style={{ marginTop: 20 }}>Documentación y Trazabilidad</h3>
      <div className="checkbox-group" style={{ marginBottom: 12 }}>
        {[
          ["aptoAlimentaria", "Apto industria alimentaria / superficies contacto"],
          ["ft", "Ficha Técnica disponible (Obligatoria)"],
          ["msds", "MSDS / Hoja de Seguridad disponible (Obligatoria)"],
        ].map(([k, l]) => (
          <label key={k} className={`checkbox-card ${errors[k] ? "checkbox-card-error" : ""}`}>
            <input type="checkbox" checked={form[k]} onChange={(e) => upd(k, e.target.checked)} className="form-checkbox" />
            <span>{l}</span>
          </label>
        ))}
      </div>
      {(errors.ft || errors.msds) && <span className="form-error-msg">{errors.ft || errors.msds}</span>}

      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Lote / Referencia recepción</label>
          <input className="form-input" value={form.lote} onChange={(e) => upd("lote", e.target.value)} placeholder="Según envase y RC.EP.09" />
        </div>
        <div className="form-group">
          <label className="form-label">Fecha de vencimiento / caducidad *</label>
          <input type="date" className={`form-input ${errors.venc ? "form-input-error" : ""}`} value={form.venc} onChange={(e) => upd("venc", e.target.value)} />
          {errors.venc && <span className="form-error-msg">{errors.venc}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Estado técnico</label>
          <select className="form-select" value={form.estadoTecnico} onChange={(e) => upd("estadoTecnico", e.target.value)}>
            {ESTADO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Registro de recepción / evidencia</label>
          <input className="form-input" value={form.registroRecepcion} onChange={(e) => upd("registroRecepcion", e.target.value)} placeholder="Registrar cada recepción en RC.EP.09" />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: 12 }}>
        <label className="form-label">Observaciones</label>
        <textarea className="form-textarea" value={form.observaciones} onChange={(e) => upd("observaciones", e.target.value)} rows={2} placeholder="Ej: No mezclar con otros químicos; respetar dosis, temperatura y tiempo de contacto" />
      </div>

      <div className="form-actions">
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}>
          {isNew ? "Agregar Insumo" : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}

export default function RCLD03({ supplies, setSupplies, user, toast }) {
  const [showForm, setShowForm] = useState(false);
  const [editSupply, setEditSupply] = useState(null);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  const alertCount = useMemo(() => supplies.filter((s) => isExpired(s.venc) || s.estadoTecnico === "rechazado").length, [supplies]);

  const filtered = useMemo(() =>
    supplies.filter((s) => {
      if (filterEstado && (s.estadoTecnico || s.estado) !== filterEstado) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return s.nombre.toLowerCase().includes(q) || s.codigo.toLowerCase().includes(q) || s.proveedor.toLowerCase().includes(q) || (s.ingrediente || "").toLowerCase().includes(q);
    }),
  [supplies, search, filterEstado]);

  const stats = useMemo(() => ({
    total: supplies.length,
    aprobado: supplies.filter(s => (s.estadoTecnico || s.estado) === "aprobado").length,
    condicionado: supplies.filter(s => (s.estadoTecnico || s.estado) === "condicionado").length,
    alertas: alertCount,
  }), [supplies, alertCount]);

  const handleSave = useCallback((supply) => {
    if (editSupply) {
      setSupplies((prev) => prev.map((s) => (s.id === supply.id ? supply : s)));
      toast.success(`Insumo "${supply.nombre}" actualizado.`);
    } else {
      const newSup = { ...supply, id: newSupplyId(supplies) };
      setSupplies((prev) => [...prev, newSup]);
      toast.success(`Insumo "${supply.nombre}" agregado exitosamente.`);
    }
    setShowForm(false);
    setEditSupply(null);
  }, [editSupply, supplies, setSupplies, toast]);

  const handleEdit = useCallback((s) => {
    setEditSupply(s);
    setShowForm(true);
  }, []);

  if (showForm) {
    return (
      <div className="page animate-fade-in">
        <div className="page-back-header">
          <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditSupply(null); }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 3L5 8l5 5"/></svg>
            Volver
          </button>
          <h1 className="page-title">RC.LD.03 — Listado de Insumos de Limpieza y Desinfección</h1>
        </div>
        <SupplyForm supply={editSupply} onSave={handleSave} onCancel={() => { setShowForm(false); setEditSupply(null); }} allSupplies={supplies} toast={toast} />
      </div>
    );
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">RC.LD.03 — Insumos de Limpieza y Desinfección</h1>
          <p className="page-subtitle">Lista maestra técnica · Rev. 03 · Vigente 09/05/2026 · {supplies.length} insumo(s)</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={() => { exportRC_LD03(supplies, user).catch(e => alert('Error: ' + e.message)); }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 5V3h8v2M4 11H2V6h12v5h-2M4 9h8v4H4z"/></svg>
            Imprimir
          </button>
          {user.role === "admin" && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>
              Agregar
            </button>
          )}
        </div>
      </div>

      <PrintHeader docCode="RC.LD.03" />

      {/* Stats row */}
      <div className="stats-row" style={{ marginBottom: 16 }}>
        {[
          { label: "Total", value: stats.total, color: "var(--color-primary)" },
          { label: "Aprobados", value: stats.aprobado, color: "var(--color-success)" },
          { label: "Condicionados", value: stats.condicionado, color: "var(--color-warning)" },
          { label: "Alertas", value: stats.alertas, color: "var(--color-danger)" },
        ].map(s => (
          <div key={s.label} className="stat-mini" style={{ borderLeft: `3px solid ${s.color}` }}>
            <span className="stat-mini-value">{s.value}</span>
            <span className="stat-mini-label">{s.label}</span>
          </div>
        ))}
      </div>

      {alertCount > 0 && (
        <div className="alert-card alert-danger" style={{ marginBottom: 12 }}>
          <span className="alert-dot" />
          <span>🚨 {alertCount} insumo(s) vencido(s) o rechazado(s). <strong>No deben usarse en planta.</strong></span>
        </div>
      )}

      <div className="filters-row">
        <div className="input-wrapper" style={{ flex: 1, maxWidth: 300 }}>
          <svg className="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="5" /><path d="M14 14l-3.5-3.5" />
          </svg>
          <input className="form-input" placeholder="Buscar nombre, código, proveedor o ingrediente..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-select" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} style={{ maxWidth: 250 }}>
          <option value="">Todos los estados</option>
          {ESTADO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="filters-count">{filtered.length} insumo(s)</span>
      </div>

      <div className="card table-card">
        <div className="table-responsive">
          <table className="data-table data-table-compact">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Presentación</th>
                <th>Proveedor</th>
                <th>Ingrediente Activo</th>
                <th className="td-center">Apta</th>
                <th className="td-center">FT</th>
                <th className="td-center">MSDS</th>
                <th>Lote</th>
                <th>Vencimiento</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={12} className="td-empty"><p>No se encontraron insumos</p></td></tr>
              ) : filtered.map((s) => {
                const venc = isExpired(s.venc);
                const soon = !venc && isSoon(s.venc);
                const est = (s.estadoTecnico || s.estado);
                const estDisplay = est === "rechazado" || venc ? "rechazado" : est;
                return (
                  <tr key={s.id} className={venc ? "row-danger" : soon ? "row-warning" : ""}>
                    <td className="td-mono td-bold">{s.codigo}</td>
                    <td className="td-bold">{s.nombre}</td>
                    <td className="td-small">{s.descripcion || "—"}</td>
                    <td className="td-small">{s.proveedor}</td>
                    <td className="td-small">{s.ingrediente || "—"}</td>
                    <td className="td-center"><span className={(s.aptoAlimentaria || s.apta) ? "text-success" : "text-danger"}>{(s.aptoAlimentaria || s.apta) ? "✓" : "✗"}</span></td>
                    <td className="td-center"><span className={s.ft ? "text-success" : "text-danger"}>{s.ft ? "✓" : "✗"}</span></td>
                    <td className="td-center"><span className={s.msds ? "text-success" : "text-danger"}>{s.msds ? "✓" : "✗"}</span></td>
                    <td className="td-mono td-small">{s.lote || "—"}</td>
                    <td>
                      <span className={`text-sm-bold ${venc ? "text-danger" : soon ? "text-warning" : ""}`}>
                        {fmtDate(s.venc)}{venc ? " !" : soon ? " ⚠" : ""}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${estDisplay === "aprobado" ? "approved" : estDisplay === "condicionado" || estDisplay === "no_contacto" ? "pending" : "rejected"}`}>
                        <span className="status-dot" />
                        {estDisplay === "aprobado" ? "Aprobado" : estDisplay === "condicionado" ? "Condicionado" : estDisplay === "no_contacto" ? "No contacto" : "Rechazado"}
                      </span>
                    </td>
                    <td>
                      {user.role === "admin" && (
                        <button className="btn-icon" title="Editar" onClick={() => handleEdit(s)}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8.5 2.5l3 3L4 13H1v-3L8.5 2.5z"/></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official notes */}
      <div className="card">
        <h3 className="card-title">Relación Documental y Criterio de Uso</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="info-banner info-primary" style={{ margin: 0 }}>
            <strong>RC.LD.03</strong> es la lista maestra de insumos aprobados para limpieza y desinfección. <strong>RC.EP.09</strong> se mantiene como registro de recepción y debe respaldar proveedor, documentación recibida, lote, vencimiento, condición del envase y decisión de recepción.
          </div>
          <div className="info-banner info-warning" style={{ margin: 0 }}>
            Ningún insumo debe liberarse para uso si no cuenta con identificación, ficha técnica/MSDS cuando aplique, lote, vencimiento vigente y recepción aprobada o condicionada documentada en RC.EP.09.
          </div>
        </div>
      </div>
    </div>
  );
}
