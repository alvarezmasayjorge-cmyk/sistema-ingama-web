// ─── CONFIGURACIÓN DE ÁREAS RC.LD.01 ──────────────────────────────────────────
// Cada área tiene su número de registro, nombre oficial y metadata

export const AREAS_CONFIG = [
  { num: 1, key: "Recepción - Almacenamiento y Pre-Limpieza de MPH", registro: "RC.LD.01-01" },
  { num: 2, key: "Recepción Almacenamiento de MPH", registro: "RC.LD.01-02" },
  { num: 3, key: "Pre-Limpieza de MPH", registro: "RC.LD.01-03" },
  { num: 4, key: "Secado MPH", registro: "RC.LD.01-04" },
  { num: 5, key: "Seleccionado de MPS", registro: "RC.LD.01-05" },
  { num: 6, key: "Pre-Limpieza y Clasificado MPS", registro: "RC.LD.01-05.1" },
  { num: 7, key: "Almacenamiento de MPS", registro: "RC.LD.01-06" },
  { num: 8, key: "Caldero y Distribuidor de Vapor", registro: "RC.LD.01-07" },
  { num: 9, key: "Sancochado", registro: "RC.LD.01-08" },
  { num: 10, key: "Pelado Mecánico", registro: "RC.LD.01-09" },
  { num: 11, key: "Seleccionado de Almendra Pelada Cruda", registro: "RC.LD.01-10" },
  { num: 12, key: "Clasificado de Almendra Pelada por Tipo (Zaranda)", registro: "RC.LD.01-11" },
  { num: 13, key: "Recorte", registro: "RC.LD.01-12" },
  { num: 14, key: "Deshidratado de Almendra Pelada", registro: "RC.LD.01-13" },
  { num: 15, key: "Enfriado", registro: "RC.LD.01-14" },
  { num: 16, key: "Seleccionado de Almendra Pelada Deshidratada", registro: "RC.LD.01-15" },
  { num: 17, key: "Embalado de Broken - Almendra de Primera y Recorte", registro: "RC.LD.01-16" },
  { num: 18, key: "Pesado y Sellado", registro: "RC.LD.01-17" },
  { num: 19, key: 'Depósito de Producto Terminado "A"', registro: "RC.LD.01-18" },
  { num: 20, key: 'Almacén de Producto Terminado "B"', registro: "RC.LD.01-19" },
  { num: 21, key: "Depósito de Residuos", registro: "RC.LD.01-20" },
  { num: 22, key: "Vestidor y Lavamanos 1 del Área del Seleccionado de Almendra Pelada Cruda", registro: "RC.LD.01-21" },
  { num: 23, key: 'Vestidor-Lavamanos "2" Pelado Mecánico y Seleccionado MPS', registro: "RC.LD.01-22" },
  { num: 24, key: 'Vestidor-Lavamanos "3" Sancochado y Secado de MPH (Cilindreros)', registro: "RC.LD.01-23" },
  { num: 25, key: 'Vestidor-Lavamanos "4" Seleccionado de Almendra Pelada Deshidratada', registro: "RC.LD.01-24" },
  { num: 26, key: "Sanitario y Ducha", registro: "RC.LD.01-25" },
  { num: 27, key: "Comedor", registro: "RC.LD.01-26" },
  { num: 28, key: "Externa e Interna", registro: "RC.LD.01-27" },
  { num: 29, key: "Tanque de Agua", registro: "RC.LD.01-28" },
  { num: 30, key: "Depósito de Material de Embalaje Primario y Secundario", registro: "RC.LD.01-29" },
  { num: 31, key: "Depósito de Material de Embalaje Materia Prima", registro: "RC.LD.01-30" },
  { num: 32, key: "Lavandería de Área Blanca", registro: "RC.LD.01-31" },
  { num: 33, key: "Depósito", registro: "RC.LD.01-32" },
];

// ─── FRECUENCIAS DE LIMPIEZA ──────────────────────────────────────────────────
export const FRECUENCIAS = [
  { code: "D", label: "Diario", color: "#3b82f6" },
  { code: "S", label: "Semanal", color: "#8b5cf6" },
  { code: "Q", label: "Quincenal", color: "#f59e0b" },
  { code: "M", label: "Mensual", color: "#10b981" },
];

// ─── MOMENTO DE EJECUCIÓN ─────────────────────────────────────────────────────
export const MOMENTOS = [
  { code: "I", label: "Inicio de Jornada Laboral", short: "Inicio" },
  { code: "F", label: "Finalización de Jornada Laboral", short: "Final" },
];

// ─── HELPER: obtener config de un área ────────────────────────────────────────
export function getAreaConfig(areaName) {
  return AREAS_CONFIG.find(a => a.key === areaName) || null;
}

// ─── DOCUMENTO INFO ───────────────────────────────────────────────────────────
export const DOC_INFO = {
  "RC.LD.01": {
    titulo: "Registro de Limpieza y Desinfección",
    revision: "Rev. 03",
    vigencia: "2026",
    norma: "FSSC 22000 v6 / ISO/TS 22002-1",
  },
  "RC.LD.02": {
    titulo: "Registro Personal Autorizado Depósito Materiales e Insumos de L&D",
    revision: "Rev. 02",
    vigencia: "2026",
    norma: "FSSC 22000 v6 / ISO/TS 22002-1",
  },
  "RC.LD.03": {
    titulo: "Registro Lista de Insumos de Limpieza y Desinfección",
    revision: "Rev. 03",
    vigencia: "2026",
    norma: "FSSC 22000 v6 / ISO/TS 22002-1",
  },
  "RC.MA.09": {
    titulo: "Registro Control de Hisopado de Manos y Superficie ATP",
    revision: "Rev. 01",
    vigencia: "2026",
    norma: "FSSC 22000 v6 / ISO/TS 22002-1",
  },
};
