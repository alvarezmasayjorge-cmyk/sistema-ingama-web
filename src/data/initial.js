import areasItemsData from './areas_items.json';
import { AREAS_CONFIG, FRECUENCIAS, MOMENTOS, DOC_INFO } from './areasConfig';

// ─── USERS ─────────────────────────────────────────────────────────────────────
export const USERS_DB = [
  { id: 1, name: "Admin Sistema", username: "admin", password: "admin123", role: "admin", initials: "AS", roleLabel: "Administrador" },
  { id: 2, name: "Carlos Mamani", username: "carlos", password: "carlos123", role: "control", initials: "CM", roleLabel: "Resp. Control", areas: ["Sanitario y Ducha", "Comedor"] },
  { id: 3, name: "Rosa Vaca Méndez", username: "rosa", password: "rosa123", role: "seguimiento", initials: "RV", roleLabel: "Resp. Seguimiento" },
];

// ─── AREAS & ITEMS ─────────────────────────────────────────────────────────────
// Ordenadas por número de registro oficial (1-33)
export const AREAS = AREAS_CONFIG.map(a => a.key);
export const ITEMS_AREA = areasItemsData;

// Re-export para acceso directo
export { AREAS_CONFIG, FRECUENCIAS, MOMENTOS, DOC_INFO };

// ─── STATUS MAPS ───────────────────────────────────────────────────────────────
export const STATUS = {
  borrador: { label: "Borrador", bg: "var(--status-draft-bg)", text: "var(--status-draft-text)", dot: "var(--status-draft-dot)", cls: "status-draft" },
  firmado_control: { label: "Pend. Verificación", bg: "var(--status-pending-bg)", text: "var(--status-pending-text)", dot: "var(--status-pending-dot)", cls: "status-pending" },
  aprobado: { label: "Aprobado", bg: "var(--status-approved-bg)", text: "var(--status-approved-text)", dot: "var(--status-approved-dot)", cls: "status-approved" },
  rechazado: { label: "Rechazado", bg: "var(--status-rejected-bg)", text: "var(--status-rejected-text)", dot: "var(--status-rejected-dot)", cls: "status-rejected" },
};

// ─── INITIAL DATA ──────────────────────────────────────────────────────────────
export const INIT_RECORDS = [
  { id: "RC.LD.01-2026-001", area: "Sanitario y Ducha", mes: "Mayo 2026", respControl: "Carlos Mamani", respSeg: "Rosa Vaca Méndez", estado: "aprobado", fecha: "2026-05-05", resultado: "conforme", correccion: "", liberacion: "si", firmaCtrl: { firmado: true, nombre: "Carlos Mamani", rol: "control", fechaHora: "2026-05-05T08:30:00" }, firmaSeg: { firmado: true, nombre: "Rosa Vaca Méndez", rol: "seguimiento", fechaHora: "2026-05-05T10:15:00" }, obs: "Sin novedad. Área conforme.", items: {} },
  { id: "RC.LD.01-2026-002", area: "Comedor", mes: "Mayo 2026", respControl: "Carlos Mamani", respSeg: "Rosa Vaca Méndez", estado: "firmado_control", fecha: "2026-05-07", resultado: "no_conforme", correccion: "Se volvió a limpiar mesas.", liberacion: "si", firmaCtrl: { firmado: true, nombre: "Carlos Mamani", rol: "control", fechaHora: "2026-05-07T07:00:00" }, firmaSeg: null, obs: "Mesas sucias.", items: {} }
];

export const INIT_PERSONNEL = [
  { id: 1, nombre: "Carlos Mamani", cargo: "Operario de Planta A", telefono: "7521-3456", fechaAut: "2026-01-15", capacitacion: "CAP-2026-001 / Manejo Químicos", msds: true, epp: true, noMezcla: true, vigencia: "2026-12-31", estado: "autorizado", autorizadoPor: "Rosa Vaca M." },
  { id: 2, nombre: "Rosa Vaca Méndez", cargo: "Jefe de Calidad", telefono: "7654-9876", fechaAut: "2026-01-15", capacitacion: "CAP-2026-001 / Manejo Químicos", msds: true, epp: true, noMezcla: true, vigencia: "2026-12-31", estado: "autorizado", autorizadoPor: "Gerencia" },
];

export const INIT_SUPPLIES = [
  { id: 1, codigo: "IN-001", nombre: "Jabón Yodado", unidad: "Litro", proveedor: "Quimbol Bolivia SRL", ingrediente: "Yodo-PVP 1%", conc: "1% p/v", apta: true, superficie: "Contacto directo con alimento", ft: true, msds: true, lote: "JY-2026-03", venc: "2027-03-01", estado: "aprobado" },
  { id: 2, codigo: "IN-002", nombre: "Detergente Ace Patito", unidad: "Kg", proveedor: "Distribuidora Central", ingrediente: "Tensoactivos aniónicos 15%", conc: "100% polvo", apta: false, superficie: "Pisos y paredes", ft: true, msds: true, lote: "ACE-2026-02", venc: "2027-06-01", estado: "condicionado" },
];

export const INIT_RCMA9 = [
  { id: "RC.MA.09-2026-001", fecha: "2026-05-09", area: "Sanitario y Ducha", identificacion: "Lavamanos", tipo: "superficie", respControl: "Carlos Mamani", resultado: "15", correccion: "", obs: "Conforme", firmaCtrl: { firmado: true, nombre: "Carlos Mamani", rol: "control", fechaHora: "2026-05-09T09:00:00", tipo: "digital" }, firmaSeg: null },
  { id: "RC.MA.09-2026-002", fecha: "2026-05-09", area: "Pelado Mecánico", identificacion: "Bañadores", tipo: "superficie", respControl: "Rosa Vaca Méndez", resultado: "520", correccion: "Re-lavado y desinfección", obs: "Fuera de límite", firmaCtrl: { firmado: true, nombre: "Rosa Vaca Méndez", rol: "seguimiento", fechaHora: "2026-05-09T10:30:00", tipo: "digital" }, firmaSeg: null },
];

// ─── NAV ITEMS ─────────────────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "rcld01", label: "RC.LD.01 Limpieza", icon: "cleaning" },
  { id: "rcld02", label: "RC.LD.02 Personal", icon: "people" },
  { id: "rcld03", label: "RC.LD.03 Insumos", icon: "inventory" },
  { id: "rcma9", label: "RC.MA.09 Hisopado", icon: "flask" },
  { id: "docs", label: "Documentos", icon: "docs" }
];
