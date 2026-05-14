// ═══════════════════════════════════════════════════════════════════════════════
// VALIDADORES CENTRALIZADOS — Sistema INGAMA
// Cada función retorna un objeto { campo: "mensaje de error" }
// Si retorna {} → datos válidos
// ═══════════════════════════════════════════════════════════════════════════════

import { AREAS } from "./data/initial";
import { isExpired } from "./helpers";

// ─── HELPERS DE VALIDACIÓN ────────────────────────────────────────────────────
const isEmpty = (v) => v === null || v === undefined || (typeof v === "string" && !v.trim());

const isValidDate = (d) => {
  if (!d) return false;
  const date = new Date(d);
  return date instanceof Date && !isNaN(date);
};

const dateAfter = (d1, d2) => {
  if (!isValidDate(d1) || !isValidDate(d2)) return false;
  return new Date(d1) > new Date(d2);
};

const isPhoneFormat = (v) => /^\d{4}-\d{4}$/.test(v);

const isSupplyCodeFormat = (v) => /^IN-\d{3,}$/.test(v);

const isRecordIdFormat = (v) => /^RC\.LD\.01-\d{4}-\d{3,}$/.test(v);

const isCapCodeFormat = (v) => /^CAP-\d{4}-\d{3,}$/.test(v);

const isConcentrationFormat = (v) => {
  if (!v || !v.trim()) return true; // opcional
  return /^\d+(\.\d+)?\s*(%|ppm|mg\/l|g\/l|p\/v|v\/v)/i.test(v);
};

// ─── VALIDADOR: PERSONAL (RC.LD.02) ────────────────────────────────────────────
export function validatePersonnel(form, allPersonnel = [], options = {}) {
  const { isNew = true, currentId = null } = options;
  const errors = {};

  // Campos requeridos
  if (isEmpty(form.nombre)) {
    errors.nombre = "El nombre es obligatorio";
  } else if (form.nombre.trim().length < 3) {
    errors.nombre = "Mínimo 3 caracteres";
  } else if (form.nombre.trim().length > 80) {
    errors.nombre = "Máximo 80 caracteres";
  }

  if (isEmpty(form.cargo)) {
    errors.cargo = "El cargo es obligatorio";
  } else if (form.cargo.trim().length < 3) {
    errors.cargo = "Mínimo 3 caracteres";
  }

  if (isEmpty(form.vigencia)) {
    errors.vigencia = "La vigencia es obligatoria";
  } else if (!isValidDate(form.vigencia)) {
    errors.vigencia = "Fecha de vigencia inválida";
  }

  // Formato teléfono (opcional pero si existe valida)
  if (form.telefono && !isPhoneFormat(form.telefono)) {
    errors.telefono = "Formato: 0000-0000";
  }

  // Formato código capacitación (opcional)
  if (form.codCap && !isCapCodeFormat(form.codCap)) {
    errors.codCap = "Formato: CAP-AAAA-NNN";
  }

  // Validación temporal: fechaCap <= fechaAut <= vigencia
  if (form.fechaCap && form.fechaAut && dateAfter(form.fechaCap, form.fechaAut)) {
    errors.fechaCap = "La capacitación debe ser anterior o igual a la autorización";
  }
  if (form.fechaAut && form.vigencia && !dateAfter(form.vigencia, form.fechaAut)) {
    errors.vigencia = "La vigencia debe ser posterior a la fecha de autorización";
  }

  // ─── REGLAS DE NEGOCIO ──────────────────────────────────────────────────────
  // R1: Personal "autorizado" requiere las 3 capacitaciones
  if (form.estado === "autorizado") {
    if (!form.msds || !form.epp || !form.noMezcla) {
      errors.estado = "No se puede autorizar sin completar las 3 capacitaciones (MSDS, EPP, No mezcla)";
    }
    if (!form.fechaCap) {
      errors.fechaCap = "Requerida para autorizar al personal";
    }
    if (!form.codCap) {
      errors.codCap = "Código de capacitación requerido para autorizar";
    }
  }

  // R2: Personal "autorizado" no puede tener vigencia vencida
  if (form.estado === "autorizado" && form.vigencia && isExpired(form.vigencia)) {
    errors.vigencia = "No se puede autorizar a personal con vigencia vencida";
  }

  // ─── INTEGRIDAD REFERENCIAL ─────────────────────────────────────────────────
  // R3: Unicidad de nombre (case-insensitive)
  if (form.nombre && allPersonnel.length > 0) {
    const nombreLower = form.nombre.trim().toLowerCase();
    const duplicate = allPersonnel.find(
      (p) => p.nombre.trim().toLowerCase() === nombreLower && p.id !== currentId
    );
    if (duplicate) {
      errors.nombre = "Ya existe personal con este nombre";
    }
  }

  return errors;
}

// ─── VALIDADOR: SUMINISTRO (RC.LD.03) ──────────────────────────────────────────
export function validateSupply(form, allSupplies = [], options = {}) {
  const { isNew = true, currentId = null } = options;
  const errors = {};

  // Campos requeridos
  if (isEmpty(form.nombre)) {
    errors.nombre = "El nombre es obligatorio";
  } else if (form.nombre.trim().length < 2) {
    errors.nombre = "Mínimo 2 caracteres";
  } else if (form.nombre.trim().length > 80) {
    errors.nombre = "Máximo 80 caracteres";
  }

  if (isEmpty(form.proveedor)) {
    errors.proveedor = "El proveedor es obligatorio";
  }

  if (isEmpty(form.ingrediente)) {
    errors.ingrediente = "El ingrediente activo es obligatorio";
  }

  if (isEmpty(form.venc)) {
    errors.venc = "La fecha de vencimiento es obligatoria";
  } else if (!isValidDate(form.venc)) {
    errors.venc = "Fecha de vencimiento inválida";
  }

  // Formato código
  if (form.codigo && !isSupplyCodeFormat(form.codigo)) {
    errors.codigo = "Formato: IN-NNN";
  }

  // Formato concentración
  if (form.conc && !isConcentrationFormat(form.conc)) {
    errors.conc = "Formato: número + unidad (ej: 1% p/v, 15 ppm)";
  }

  // ─── REGLAS DE NEGOCIO ──────────────────────────────────────────────────────
  // R1: Estado "aprobado" requiere FT y MSDS
  if (form.estado === "aprobado") {
    if (!form.ft) {
      errors.ft = "Ficha técnica requerida para aprobar";
    }
    if (!form.msds) {
      errors.msds = "MSDS requerida para aprobar";
    }
  }

  // R2: No aprobar suministros vencidos
  if (form.estado === "aprobado" && form.venc && isExpired(form.venc)) {
    errors.estado = "No se puede aprobar un insumo vencido";
  }

  // R3: Si superficie es "contacto con alimento", debe ser apta
  if (form.superficie && /contacto.*aliment/i.test(form.superficie) && !form.apta) {
    errors.apta = "Insumos en contacto con alimento deben ser aptos (grado alimenticio)";
  }

  // ─── INTEGRIDAD REFERENCIAL ─────────────────────────────────────────────────
  // R4: Unicidad de código
  if (form.codigo && allSupplies.length > 0) {
    const duplicate = allSupplies.find(
      (s) => s.codigo === form.codigo && s.id !== currentId
    );
    if (duplicate) {
      errors.codigo = "Este código ya existe";
    }
  }

  // R5: Unicidad de nombre + lote (mismo producto, mismo lote)
  if (form.nombre && form.lote && allSupplies.length > 0) {
    const duplicate = allSupplies.find(
      (s) =>
        s.nombre.trim().toLowerCase() === form.nombre.trim().toLowerCase() &&
        s.lote === form.lote &&
        s.id !== currentId
    );
    if (duplicate) {
      errors.lote = "Ya existe este producto con el mismo lote";
    }
  }

  return errors;
}

// ─── VALIDADOR: REGISTRO DE LIMPIEZA (RC.LD.01) ────────────────────────────────
export function validateRecord(form, allRecords = [], options = {}) {
  const { personnel = [], requireSign = false } = options;
  const errors = {};

  // Campos requeridos
  if (isEmpty(form.area)) {
    errors.area = "El área es obligatoria";
  } else if (!AREAS.includes(form.area)) {
    errors.area = "Área no válida";
  }

  if (isEmpty(form.mes)) {
    errors.mes = "El mes es obligatorio";
  }

  if (isEmpty(form.fecha)) {
    errors.fecha = "La fecha es obligatoria";
  } else if (!isValidDate(form.fecha)) {
    errors.fecha = "Fecha inválida";
  } else if (new Date(form.fecha) > new Date()) {
    errors.fecha = "La fecha no puede ser futura";
  }

  // Validaciones específicas para firmar (no para borrador)
  if (requireSign) {
    if (isEmpty(form.resultado)) {
      errors.resultado = "Seleccione el resultado de la limpieza";
    }
    if (isEmpty(form.liberacion)) {
      errors.liberacion = "Seleccione el estado de liberación";
    }
    // Si es "no_conforme" debe haber corrección
    if (form.resultado === "no_conforme" && isEmpty(form.correccion)) {
      errors.correccion = "Describa la corrección realizada (obligatorio si no conforme)";
    }
  }

  // ─── REGLAS DE NEGOCIO ──────────────────────────────────────────────────────
  // R1: No liberar si resultado es "no_conforme"
  if (form.resultado === "no_conforme" && form.liberacion === "si") {
    errors.liberacion = "No se puede liberar un área con resultado no conforme";
  }

  // ─── INTEGRIDAD REFERENCIAL ─────────────────────────────────────────────────
  // R2: respControl debe existir en personal y estar autorizado y vigente
  if (form.respControl && personnel.length > 0) {
    const ctrl = personnel.find(
      (p) => p.nombre.trim().toLowerCase() === form.respControl.trim().toLowerCase()
    );
    if (!ctrl) {
      errors.respControl = "Responsable de Control no existe en RC.LD.02";
    } else if (ctrl.estado !== "autorizado") {
      errors.respControl = `${ctrl.nombre} no está autorizado (estado: ${ctrl.estado})`;
    } else if (isExpired(ctrl.vigencia)) {
      errors.respControl = `Autorización de ${ctrl.nombre} está vencida`;
    }
  }

  // R3: respSeg debe existir en personal
  if (form.respSeg && personnel.length > 0) {
    const seg = personnel.find(
      (p) => p.nombre.trim().toLowerCase() === form.respSeg.trim().toLowerCase()
    );
    if (!seg) {
      errors.respSeg = "Responsable de Seguimiento no existe en RC.LD.02";
    }
  }

  // R4: Unicidad de ID
  if (form.id && allRecords.length > 0 && options.isNew) {
    const duplicate = allRecords.find((r) => r.id === form.id);
    if (duplicate) {
      errors.id = "Este código de registro ya existe";
    }
  }

  return errors;
}

// ─── VALIDADOR: RCMa9 ──────────────────────────────────────────────────────────
export function validateRcma9(form, allRcma9 = [], options = {}) {
  const { currentId = null } = options;
  const errors = {};

  if (isEmpty(form.fecha)) {
    errors.fecha = "La fecha es obligatoria";
  } else if (!isValidDate(form.fecha)) {
    errors.fecha = "Fecha inválida";
  } else if (new Date(form.fecha) > new Date()) {
    errors.fecha = "La fecha no puede ser futura";
  }

  if (isEmpty(form.area)) {
    errors.area = "El área es obligatoria";
  } else if (!AREAS.includes(form.area)) {
    errors.area = "Área no válida";
  }

  if (form.valor !== undefined && form.valor !== "") {
    const v = Number(form.valor);
    if (isNaN(v)) {
      errors.valor = "El valor debe ser numérico";
    } else if (v < 0) {
      errors.valor = "El valor no puede ser negativo";
    }
  }

  return errors;
}

// ─── SCHEMA VALIDATION PARA LOCALSTORAGE ───────────────────────────────────────
// Valida estructura básica al hidratar datos del localStorage

export const SCHEMAS = {
  records: {
    type: "array",
    item: {
      id: "string",
      area: "string",
      mes: "string",
      respControl: "string",
      respSeg: "string",
      estado: "string",
      fecha: "string",
    },
  },
  personnel: {
    type: "array",
    item: {
      id: "number",
      nombre: "string",
      cargo: "string",
      estado: "string",
      vigencia: "string",
    },
  },
  supplies: {
    type: "array",
    item: {
      id: "number",
      codigo: "string",
      nombre: "string",
      proveedor: "string",
      venc: "string",
      estado: "string",
    },
  },
  rcma9: {
    type: "array",
    item: {},
  },
};

export function validateSchema(data, schema) {
  if (!schema) return { valid: true, data };
  if (schema.type === "array") {
    if (!Array.isArray(data)) {
      return { valid: false, reason: "Se esperaba un array" };
    }
    // Filtra elementos que no cumplen el schema mínimo
    const validItems = data.filter((item) => {
      if (!item || typeof item !== "object") return false;
      return Object.entries(schema.item).every(([key, expectedType]) => {
        const val = item[key];
        return typeof val === expectedType;
      });
    });
    return {
      valid: validItems.length === data.length,
      data: validItems,
      filtered: data.length - validItems.length,
    };
  }
  return { valid: true, data };
}

// ─── HELPER: contar errores ─────────────────────────────────────────────────────
export const hasErrors = (errors) => Object.keys(errors).length > 0;

// ─── HELPER: validar referencia a personal ─────────────────────────────────────
export function findPersonByName(name, personnel) {
  if (!name || !personnel?.length) return null;
  return personnel.find(
    (p) => p.nombre.trim().toLowerCase() === name.trim().toLowerCase()
  ) || null;
}

// ─── HELPER: validar si un suministro es usable ────────────────────────────────
export function isSupplyUsable(supply) {
  if (!supply) return false;
  if (supply.estado === "rechazado") return false;
  if (isExpired(supply.venc)) return false;
  return true;
}
