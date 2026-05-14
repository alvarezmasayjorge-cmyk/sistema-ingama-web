import { useState, useMemo, useCallback } from "react";
import { fmtDate, isExpired, isSoon, newPersonnelId, todayISO } from "../helpers";
import { validatePersonnel, hasErrors } from "../validators";
import SignatureBox from "../components/SigCanvas";
import PrintHeader from "../components/PrintHeader";
import { exportRC_LD02 } from "../utils/exportXlsx";

/**
 * RC.LD.02 — PERSONAL AUTORIZADO PARA INGRESAR AL DEPÓSITO DE MATERIALES E INSUMOS
 * Columnas reales del Excel Rev.02 (actualizado 09-05-2026):
 * N° | Nombre del Miembro | Cargo | Firma | Número Teléfono Celular | Fecha de Autorización
 * | Capacitación Recibida | MSDS/Fichas Técnicas Revisadas | EPP y Diluciones Evaluado
 * | No Mezcla de Químicos Evaluado | Vigencia/Próxima Revisión | Responsable que Autoriza
 * | Estado de Autorización | Observaciones/Control Complementario
 */

const EMPTY_PERSON = {
  nombre: "", cargo: "", telefono: "", fechaAut: "",
  capacitacion: "", msds: false, epp: false, noMezcla: false,
  vigencia: "", autorizadoPor: "", estado: "pendiente",
  observaciones: "",
};

const ESTADO_OPTIONS = [
  { value: "autorizado", label: "Autorizado", cls: "approved" },
  { value: "pendiente", label: "Pendiente", cls: "pending" },
  { value: "suspendido", label: "Suspendido", cls: "rejected" },
];

function PersonnelForm({ person, onSave, onCancel, allPersonnel, toast, user }) {
  const isNew = !person;
  const [form, setForm] = useState(person || { ...EMPTY_PERSON, autorizadoPor: user?.name || "" });
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
    <div className="card animate-fade-in" style={{ maxWidth: 740 }}>
      <h3 className="card-title">{isNew ? "Agregar Miembro" : "Editar Miembro"}</h3>

      {/* Datos personales */}
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Nombre del Miembro *</label>
          <input className={`form-input ${errors.nombre ? "form-input-error" : ""}`} value={form.nombre} onChange={(e) => upd("nombre", e.target.value)} placeholder="Nombre y apellidos completos" />
          {errors.nombre && <span className="form-error-msg">{errors.nombre}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Cargo *</label>
          <input className={`form-input ${errors.cargo ? "form-input-error" : ""}`} value={form.cargo} onChange={(e) => upd("cargo", e.target.value)} placeholder="Ej: Operario de Limpieza" />
          {errors.cargo && <span className="form-error-msg">{errors.cargo}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Número Teléfono Celular</label>
          <input className={`form-input ${errors.telefono ? "form-input-error" : ""}`} value={form.telefono} onChange={(e) => upd("telefono", e.target.value)} placeholder="7XXX-XXXX" />
          {errors.telefono && <span className="form-error-msg">{errors.telefono}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Fecha de Autorización *</label>
          <input type="date" className={`form-input ${errors.fechaAut ? "form-input-error" : ""}`} value={form.fechaAut} onChange={(e) => upd("fechaAut", e.target.value)} />
          {errors.fechaAut && <span className="form-error-msg">{errors.fechaAut}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Vigencia / Próxima Revisión *</label>
          <input type="date" className={`form-input ${errors.vigencia ? "form-input-error" : ""}`} value={form.vigencia} onChange={(e) => upd("vigencia", e.target.value)} />
          {errors.vigencia && <span className="form-error-msg">{errors.vigencia}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Responsable que Autoriza</label>
          <input className="form-input" value={form.autorizadoPor} onChange={(e) => upd("autorizadoPor", e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Estado de Autorización *</label>
          <select className={`form-select ${errors.estado ? "form-input-error" : ""}`} value={form.estado} onChange={(e) => upd("estado", e.target.value)}>
            {ESTADO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {errors.estado && <span className="form-error-msg">{errors.estado}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Capacitación Recibida</label>
          <input className="form-input" value={form.capacitacion} onChange={(e) => upd("capacitacion", e.target.value)} placeholder="Ej: CAP-2026-001 / Manejo seguro químicos" />
        </div>
      </div>

      {/* Evaluaciones */}
      <div className="form-group" style={{ marginTop: "1rem" }}>
        <label className="form-label">Evaluaciones Completadas</label>
        <div className="checkbox-group">
          {[
            ["msds", "MSDS / Fichas Técnicas Revisadas"],
            ["epp", "EPP y Diluciones Evaluado"],
            ["noMezcla", "No Mezcla de Químicos Evaluado"],
          ].map(([k, l]) => (
            <label key={k} className="checkbox-card">
              <input type="checkbox" checked={form[k]} onChange={(e) => upd(k, e.target.checked)} className="form-checkbox" />
              <span>{l}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Observaciones */}
      <div className="form-group" style={{ marginTop: "1rem" }}>
        <label className="form-label">Observaciones / Control Complementario</label>
        <textarea className="form-textarea" value={form.observaciones} onChange={(e) => upd("observaciones", e.target.value)} rows={2} placeholder="Observaciones o controles adicionales..." />
      </div>

      <div className="form-actions">
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}>
          {isNew ? "Agregar Miembro" : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}

export default function RCLD02({ personnel, setPersonnel, user, toast }) {
  const [showForm, setShowForm] = useState(false);
  const [editPerson, setEditPerson] = useState(null);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  const vencCount = useMemo(() => personnel.filter((p) => isExpired(p.vigencia)).length, [personnel]);
  const soonCount = useMemo(() => personnel.filter((p) => !isExpired(p.vigencia) && isSoon(p.vigencia)).length, [personnel]);

  const filtered = useMemo(() =>
    personnel.filter((p) => {
      if (filterEstado && p.estado !== filterEstado) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return p.nombre.toLowerCase().includes(s) || p.cargo.toLowerCase().includes(s) || (p.autorizadoPor || "").toLowerCase().includes(s);
    }),
  [personnel, search, filterEstado]);

  const stats = useMemo(() => ({
    total: personnel.length,
    autorizado: personnel.filter(p => p.estado === "autorizado").length,
    pendiente: personnel.filter(p => p.estado === "pendiente").length,
    suspendido: personnel.filter(p => p.estado === "suspendido").length,
  }), [personnel]);

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
          <h1 className="page-title">RC.LD.02 — Personal Autorizado para Depósito de Materiales</h1>
        </div>
        <PersonnelForm person={editPerson} onSave={handleSave} onCancel={() => { setShowForm(false); setEditPerson(null); }} allPersonnel={personnel} toast={toast} user={user} />
      </div>
    );
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">RC.LD.02 — Personal Autorizado</h1>
          <p className="page-subtitle">Depósito de Materiales e Insumos · Rev. 02 · Vigente 09-05-2026 · {personnel.length} miembro(s)</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={() => { exportRC_LD02(personnel, user).catch(e => alert('Error: ' + e.message)); }}>
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

      <PrintHeader docCode="RC.LD.02" />

      {/* Stats row */}
      <div className="stats-row" style={{ marginBottom: 16 }}>
        {[
          { label: "Total", value: stats.total, color: "var(--color-primary)" },
          { label: "Autorizados", value: stats.autorizado, color: "var(--color-success)" },
          { label: "Pendientes", value: stats.pendiente, color: "var(--color-warning)" },
          { label: "Suspendidos", value: stats.suspendido, color: "var(--color-danger)" },
        ].map(s => (
          <div key={s.label} className="stat-mini" style={{ borderLeft: `3px solid ${s.color}` }}>
            <span className="stat-mini-value">{s.value}</span>
            <span className="stat-mini-label">{s.label}</span>
          </div>
        ))}
      </div>

      {(vencCount > 0 || soonCount > 0) && (
        <div className="alert-card alert-warning" style={{ marginBottom: 12 }}>
          <span className="alert-dot" />
          <span>⚠️ {vencCount} autorización(es) vencida(s) y {soonCount} próxima(s) a vencer.</span>
        </div>
      )}

      <div className="filters-row">
        <div className="input-wrapper" style={{ flex: 1, maxWidth: 300 }}>
          <svg className="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="5" /><path d="M14 14l-3.5-3.5" />
          </svg>
          <input className="form-input" placeholder="Buscar por nombre, cargo o autorizador..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-select" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Todos los estados</option>
          {ESTADO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="filters-count">{filtered.length} miembro(s)</span>
      </div>

      <div className="card table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{width:40}}>N°</th>
                <th>Nombre del Miembro</th>
                <th>Cargo</th>
                <th>Teléfono</th>
                <th>Fecha Aut.</th>
                <th className="td-center">MSDS</th>
                <th className="td-center">EPP</th>
                <th className="td-center">No Mezcla</th>
                <th>Vigencia</th>
                <th>Autoriza</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={12} className="td-empty"><p>No se encontraron miembros</p></td></tr>
              ) : filtered.map((p, i) => {
                const venc = isExpired(p.vigencia);
                const soon = !venc && isSoon(p.vigencia);
                return (
                  <tr key={p.id} className={venc ? "row-danger" : soon ? "row-warning" : ""}>
                    <td className="td-center text-muted">{i + 1}</td>
                    <td className="td-bold">{p.nombre}</td>
                    <td className="td-small">{p.cargo}</td>
                    <td className="td-small">{p.telefono || "—"}</td>
                    <td className="td-small">{fmtDate(p.fechaAut)}</td>
                    <td className="td-center"><span className={p.msds ? "text-success" : "text-danger"}>{p.msds ? "✓" : "✗"}</span></td>
                    <td className="td-center"><span className={p.epp ? "text-success" : "text-danger"}>{p.epp ? "✓" : "✗"}</span></td>
                    <td className="td-center"><span className={p.noMezcla ? "text-success" : "text-danger"}>{p.noMezcla ? "✓" : "✗"}</span></td>
                    <td>
                      <span className={`text-sm-bold ${venc ? "text-danger" : soon ? "text-warning" : ""}`}>
                        {fmtDate(p.vigencia)}{venc ? " !" : soon ? " ⚠" : ""}
                      </span>
                    </td>
                    <td className="td-small">{p.autorizadoPor || "—"}</td>
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
      </div>

      {/* Official notes from the register */}
      <div className="card">
        <h3 className="card-title">Criterios del Registro RC.LD.02</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["AUTORIZACIÓN", "El ingreso al depósito de materiales e insumos queda limitado al personal registrado, capacitado y con autorización vigente."],
            ["CAPACITACIÓN", "Capacitación mínima: manejo seguro de químicos, lectura de MSDS/ficha técnica, uso de EPP, preparación de diluciones y prohibición de mezcla de químicos incompatibles."],
            ["VIGENCIA", "La autorización debe revisarse al menos una vez al año o cuando exista cambio de personal, función, químico, método de preparación o desviación en el manejo de insumos."],
            ["CONTROL", "El almacenamiento separado, inventario, condición del depósito y entradas/salidas de insumos se verifican mediante los registros aplicables del sistema de limpieza, desinfección y recepción de insumos."],
          ].map(([title, text]) => (
            <div key={title} className="info-banner info-primary" style={{ margin: 0 }}>
              <strong>{title}:</strong> {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
