import { useState, useMemo, useCallback } from "react";
import { fmtDate, isExpired, isSoon, newPersonnelId, todayISO } from "../helpers";
import { validatePersonnel, hasErrors } from "../validators";

const EMPTY_PERSON = {
  nombre: "", cargo: "", telefono: "", fechaAut: "", codCap: "",
  fechaCap: "", msds: false, epp: false, noMezcla: false,
  vigencia: "", estado: "pendiente", autorizadoPor: "",
};

function PersonnelForm({ person, onSave, onCancel, allPersonnel, toast }) {
  const isNew = !person;
  const [form, setForm] = useState(person || { ...EMPTY_PERSON });
  const [errors, setErrors] = useState({});
  const upd = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const validate = () => {
    const e = validatePersonnel(form, allPersonnel, {
      isNew,
      currentId: person?.id || null,
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
    <div className="card animate-fade-in" style={{ maxWidth: 640 }}>
      <h3 className="card-title">{isNew ? "Agregar Personal" : "Editar Personal"}</h3>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Nombre completo *</label>
          <input className={`form-input ${errors.nombre ? "form-input-error" : ""}`} value={form.nombre} onChange={(e) => upd("nombre", e.target.value)} placeholder="Nombre y apellidos" />
          {errors.nombre && <span className="form-error-msg">{errors.nombre}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Cargo *</label>
          <input className={`form-input ${errors.cargo ? "form-input-error" : ""}`} value={form.cargo} onChange={(e) => upd("cargo", e.target.value)} placeholder="Ej: Operario de Planta" />
          {errors.cargo && <span className="form-error-msg">{errors.cargo}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Teléfono</label>
          <input className={`form-input ${errors.telefono ? "form-input-error" : ""}`} value={form.telefono} onChange={(e) => upd("telefono", e.target.value)} placeholder="7XXX-XXXX" />
          {errors.telefono && <span className="form-error-msg">{errors.telefono}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Código Capacitación</label>
          <input className={`form-input ${errors.codCap ? "form-input-error" : ""}`} value={form.codCap} onChange={(e) => upd("codCap", e.target.value)} placeholder="CAP-2026-XXX" />
          {errors.codCap && <span className="form-error-msg">{errors.codCap}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Fecha Capacitación</label>
          <input type="date" className={`form-input ${errors.fechaCap ? "form-input-error" : ""}`} value={form.fechaCap} onChange={(e) => upd("fechaCap", e.target.value)} />
          {errors.fechaCap && <span className="form-error-msg">{errors.fechaCap}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Fecha Autorización</label>
          <input type="date" className={`form-input ${errors.fechaAut ? "form-input-error" : ""}`} value={form.fechaAut} onChange={(e) => upd("fechaAut", e.target.value)} />
          {errors.fechaAut && <span className="form-error-msg">{errors.fechaAut}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Vigencia *</label>
          <input type="date" className={`form-input ${errors.vigencia ? "form-input-error" : ""}`} value={form.vigencia} onChange={(e) => upd("vigencia", e.target.value)} />
          {errors.vigencia && <span className="form-error-msg">{errors.vigencia}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Autorizado por</label>
          <input className="form-input" value={form.autorizadoPor} onChange={(e) => upd("autorizadoPor", e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Estado</label>
          <select className={`form-select ${errors.estado ? "form-input-error" : ""}`} value={form.estado} onChange={(e) => upd("estado", e.target.value)}>
            <option value="autorizado">Autorizado</option>
            <option value="pendiente">Pendiente</option>
            <option value="suspendido">Suspendido</option>
          </select>
          {errors.estado && <span className="form-error-msg">{errors.estado}</span>}
        </div>
      </div>
      <div className="form-group" style={{ marginTop: "1rem" }}>
        <label className="form-label">Capacitaciones completadas</label>
        <div className="checkbox-group">
          {[["msds", "Hoja de Seguridad (MSDS)"], ["epp", "Uso correcto de EPP"], ["noMezcla", "No mezcla de productos"]].map(([k, l]) => (
            <label key={k} className="checkbox-card">
              <input type="checkbox" checked={form[k]} onChange={(e) => upd(k, e.target.checked)} className="form-checkbox" />
              <span>{l}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}>
          {isNew ? "Agregar Personal" : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}

export default function RCLD02({ personnel, setPersonnel, user, toast }) {
  const [showForm, setShowForm] = useState(false);
  const [editPerson, setEditPerson] = useState(null);
  const [search, setSearch] = useState("");

  const vencCount = useMemo(() => personnel.filter((p) => isExpired(p.vigencia)).length, [personnel]);
  const soonCount = useMemo(() => personnel.filter((p) => !isExpired(p.vigencia) && isSoon(p.vigencia)).length, [personnel]);

  const filtered = useMemo(() =>
    personnel.filter((p) =>
      !search || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.cargo.toLowerCase().includes(search.toLowerCase())
    ),
  [personnel, search]);

  const handleSave = useCallback((person) => {
    if (editPerson) {
      setPersonnel((prev) => prev.map((p) => (p.id === person.id ? person : p)));
      toast.success(`Personal "${person.nombre}" actualizado.`);
    } else {
      const newPerson = { ...person, id: newPersonnelId(personnel) };
      setPersonnel((prev) => [...prev, newPerson]);
      toast.success(`Personal "${person.nombre}" agregado exitosamente.`);
    }
    setShowForm(false);
    setEditPerson(null);
  }, [editPerson, personnel, setPersonnel, toast]);

  const handleEdit = useCallback((p) => {
    setEditPerson(p);
    setShowForm(true);
  }, []);

  const toggleSuspend = useCallback((p) => {
    const newEstado = p.estado === "suspendido" ? "autorizado" : "suspendido";
    setPersonnel((prev) => prev.map((x) => (x.id === p.id ? { ...x, estado: newEstado } : x)));
    toast.info(`${p.nombre} ${newEstado === "suspendido" ? "suspendido" : "reactivado"}.`);
  }, [setPersonnel, toast]);

  if (showForm) {
    return (
      <div className="page animate-fade-in">
        <div className="page-back-header">
          <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditPerson(null); }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 3L5 8l5 5"/></svg>
            Volver
          </button>
          <h1 className="page-title">RC.LD.02 — Personal Autorizado</h1>
        </div>
        <PersonnelForm person={editPerson} onSave={handleSave} onCancel={() => { setShowForm(false); setEditPerson(null); }} allPersonnel={personnel} toast={toast} />
      </div>
    );
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">RC.LD.02 — Personal Autorizado</h1>
          <p className="page-subtitle">Rev. 02 · Vigencia 2026 · {personnel.length} persona(s)</p>
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
              <h2>RC.LD.02 REGISTRO PERSONAL AUTORIZADO</h2>
              <p>Depósito de Insumos de Limpieza y Desinfección</p>
            </div>
         </div>
      </div>

      {(vencCount > 0 || soonCount > 0) && (
        <div className="alert-card alert-warning">
          <span className="alert-dot" />
          <span className="alert-msg">⚠️ {vencCount} autorización(es) vencida(s) y {soonCount} próxima(s) a vencer.</span>
        </div>
      )}

      <div className="filters-bar">
        <div className="input-wrapper input-search">
          <svg className="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="5" /><path d="M14 14l-3.5-3.5" />
          </svg>
          <input className="form-input" placeholder="Buscar por nombre o cargo..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <span className="filters-count">{filtered.length} persona(s)</span>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              {["Nombre", "Cargo", "Teléfono", "Capacitación", "MSDS", "EPP", "No mezcla", "Vigencia", "Estado", ""].map((h) => (
                <th key={h || "action"}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const venc = isExpired(p.vigencia);
              const soon = !venc && isSoon(p.vigencia);
              return (
                <tr key={p.id} className={venc ? "row-danger" : soon ? "row-warning" : ""}>
                  <td className="td-bold">{p.nombre}</td>
                  <td className="td-small">{p.cargo}</td>
                  <td className="td-small">{p.telefono}</td>
                  <td><span className="badge badge-outline">{p.codCap || "—"}</span></td>
                  {[p.msds, p.epp, p.noMezcla].map((v, i) => (
                    <td key={i} className="td-center">
                      <span className={v ? "text-success" : "text-danger"}>{v ? "✓" : "✗"}</span>
                    </td>
                  ))}
                  <td>
                    <span className={`text-sm-bold ${venc ? "text-danger" : soon ? "text-warning" : ""}`}>
                      {fmtDate(p.vigencia)}{venc ? " !" : soon ? " ⚠" : ""}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${p.estado === "autorizado" ? "approved" : p.estado === "pendiente" ? "pending" : "rejected"}`}>
                      <span className="status-dot" />
                      {p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}
                    </span>
                  </td>
                  <td>
                    {user.role === "admin" && (
                      <div className="action-buttons">
                        <button className="btn-icon" title="Editar" onClick={() => handleEdit(p)}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8.5 2.5l3 3L4 13H1v-3L8.5 2.5z"/></svg>
                        </button>
                        <button className="btn-icon" title={p.estado === "suspendido" ? "Reactivar" : "Suspender"} onClick={() => toggleSuspend(p)}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            {p.estado === "suspendido" ? <><path d="M1 7h12"/><path d="M7 1v12"/></> : <path d="M1 7h12"/>}
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="info-banner info-primary">
        <strong>Requisito ISO/TS 22002-1 §11.2:</strong> Los agentes de limpieza y sanitización deben almacenarse por separado. El acceso debe estar controlado y el personal autorizado debe haber recibido capacitación en manejo seguro de químicos, diluciones, EPP y no mezcla de productos.
      </div>
    </div>
  );
}
