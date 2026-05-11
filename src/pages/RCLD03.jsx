import { useState, useMemo, useCallback } from "react";
import { fmtDate, isExpired, isSoon, newSupplyId, newSupplyCode } from "../helpers";
import { validateSupply, hasErrors } from "../validators";

const EMPTY_SUPPLY = {
  codigo: "", nombre: "", unidad: "Litro", proveedor: "", ingrediente: "",
  conc: "", apta: false, superficie: "", ft: false, msds: false,
  lote: "", venc: "", estado: "condicionado",
};

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
    <div className="card animate-fade-in" style={{ maxWidth: 700 }}>
      <h3 className="card-title">{isNew ? "Agregar Insumo" : "Editar Insumo"}</h3>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Código</label>
          <input className={`form-input form-input-readonly ${errors.codigo ? "form-input-error" : ""}`} value={form.codigo} readOnly />
          {errors.codigo && <span className="form-error-msg">{errors.codigo}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Nombre *</label>
          <input className={`form-input ${errors.nombre ? "form-input-error" : ""}`} value={form.nombre} onChange={(e) => upd("nombre", e.target.value)} placeholder="Nombre del insumo" />
          {errors.nombre && <span className="form-error-msg">{errors.nombre}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Unidad</label>
          <select className="form-select" value={form.unidad} onChange={(e) => upd("unidad", e.target.value)}>
            {["Litro", "Kg", "Galón", "Unidad"].map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Proveedor *</label>
          <input className={`form-input ${errors.proveedor ? "form-input-error" : ""}`} value={form.proveedor} onChange={(e) => upd("proveedor", e.target.value)} />
          {errors.proveedor && <span className="form-error-msg">{errors.proveedor}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Ingrediente activo *</label>
          <input className={`form-input ${errors.ingrediente ? "form-input-error" : ""}`} value={form.ingrediente} onChange={(e) => upd("ingrediente", e.target.value)} />
          {errors.ingrediente && <span className="form-error-msg">{errors.ingrediente}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Concentración</label>
          <input className={`form-input ${errors.conc ? "form-input-error" : ""}`} value={form.conc} onChange={(e) => upd("conc", e.target.value)} placeholder="Ej: 15% p/v" />
          {errors.conc && <span className="form-error-msg">{errors.conc}</span>}
        </div>
        <div className="form-group form-group-full">
          <label className="form-label">Superficie de uso</label>
          <input className="form-input" value={form.superficie} onChange={(e) => upd("superficie", e.target.value)} placeholder="Ej: Contacto directo con alimento" />
        </div>
        <div className="form-group">
          <label className="form-label">Lote</label>
          <input className={`form-input ${errors.lote ? "form-input-error" : ""}`} value={form.lote} onChange={(e) => upd("lote", e.target.value)} />
          {errors.lote && <span className="form-error-msg">{errors.lote}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Fecha de vencimiento *</label>
          <input type="date" className={`form-input ${errors.venc ? "form-input-error" : ""}`} value={form.venc} onChange={(e) => upd("venc", e.target.value)} />
          {errors.venc && <span className="form-error-msg">{errors.venc}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Estado</label>
          <select className={`form-select ${errors.estado ? "form-input-error" : ""}`} value={form.estado} onChange={(e) => upd("estado", e.target.value)}>
            <option value="aprobado">Aprobado</option>
            <option value="condicionado">Condicionado</option>
            <option value="rechazado">Rechazado</option>
          </select>
          {errors.estado && <span className="form-error-msg">{errors.estado}</span>}
        </div>
      </div>
      <div className="form-group" style={{ marginTop: "1rem" }}>
        <label className="form-label">Verificaciones</label>
        <div className="checkbox-group">
          {[["apta", "Apta para contacto con alimento"], ["ft", "Ficha técnica disponible"], ["msds", "Hoja de seguridad (MSDS) disponible"]].map(([k, l]) => (
            <label key={k} className={`checkbox-card ${errors[k] ? "checkbox-card-error" : ""}`}>
              <input type="checkbox" checked={form[k]} onChange={(e) => upd(k, e.target.checked)} className="form-checkbox" />
              <span>{l}</span>
            </label>
          ))}
        </div>
        {(errors.apta || errors.ft || errors.msds) && (
          <span className="form-error-msg">
            {errors.apta || errors.ft || errors.msds}
          </span>
        )}
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

  const alertCount = useMemo(() => supplies.filter((s) => isExpired(s.venc) || s.estado === "rechazado").length, [supplies]);

  const filtered = useMemo(() =>
    supplies.filter((s) =>
      !search || s.nombre.toLowerCase().includes(search.toLowerCase()) || s.codigo.toLowerCase().includes(search.toLowerCase()) || s.proveedor.toLowerCase().includes(search.toLowerCase())
    ),
  [supplies, search]);

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
          <h1 className="page-title">RC.LD.03 — Insumos L&D</h1>
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
          <p className="page-subtitle">Lista maestra técnica · Rev. 02 · {supplies.length} insumo(s)</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={() => window.print()}>
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

      {/* Elemento solo visible en impresión */}
      <div className="print-only">
         <div className="print-header">
            <img src="/logo.png" alt="Logo INGAMA" className="print-logo" />
            <div>
              <h2>RC.LD.03 REGISTRO LISTA DE INSUMOS DE LIMPIEZA</h2>
              <p>Insumos autorizados FSSC 22000</p>
            </div>
         </div>
      </div>

      {alertCount > 0 && (
        <div className="alert-card alert-danger">
          <span className="alert-dot" />
          <span className="alert-msg">🚨 {alertCount} insumo(s) vencido(s) o rechazado(s). <strong>No deben usarse en planta.</strong></span>
        </div>
      )}

      <div className="filters-bar">
        <div className="input-wrapper input-search">
          <svg className="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="5" /><path d="M14 14l-3.5-3.5" />
          </svg>
          <input className="form-input" placeholder="Buscar nombre, código o proveedor..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <span className="filters-count">{filtered.length} insumo(s)</span>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              {["Código", "Nombre", "Proveedor", "Ingred. activo", "Apta", "FT", "MSDS", "Lote", "Vencimiento", "Estado", ""].map((h) => (
                <th key={h || "action"}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const venc = isExpired(s.venc);
              const soon = !venc && isSoon(s.venc);
              const est = s.estado === "rechazado" || venc ? "rechazado" : s.estado;
              return (
                <tr key={s.id} className={venc ? "row-danger" : soon ? "row-warning" : ""}>
                  <td className="td-mono td-bold">{s.codigo}</td>
                  <td className="td-bold">{s.nombre}</td>
                  <td className="td-small">{s.proveedor}</td>
                  <td className="td-small">{s.ingrediente}</td>
                  <td className="td-center"><span className={s.apta ? "text-success" : "text-danger"}>{s.apta ? "✓" : "✗"}</span></td>
                  {[s.ft, s.msds].map((v, i) => (
                    <td key={i} className="td-center"><span className={v ? "text-success" : "text-danger"}>{v ? "✓" : "✗"}</span></td>
                  ))}
                  <td className="td-mono td-small">{s.lote}</td>
                  <td>
                    <span className={`text-sm-bold ${venc ? "text-danger" : soon ? "text-warning" : ""}`}>
                      {fmtDate(s.venc)}{venc ? " !" : soon ? " ⚠" : ""}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${est === "aprobado" ? "approved" : est === "condicionado" ? "pending" : "rejected"}`}>
                      <span className="status-dot" />
                      {est.charAt(0).toUpperCase() + est.slice(1)}
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

      <div className="info-grid-2">
        <div className="info-banner info-primary">
          <strong>ISO/TS 22002-1 §11.2:</strong> Los agentes de limpieza deben ser de grado alimenticio para superficies de contacto, almacenados separados y usados según instrucciones del fabricante.
        </div>
        <div className="info-banner info-warning">
          <strong>Brecha detectada:</strong> Detergente Ace Patito y OMO están marcados como NO aptos para contacto con alimento. Verificar que no se usen en superficies de proceso.
        </div>
      </div>
    </div>
  );
}
