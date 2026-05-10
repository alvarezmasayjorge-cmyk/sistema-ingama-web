// ─── USERS ─────────────────────────────────────────────────────────────────────
export const USERS_DB = [
  { id: 1, name: "Admin Sistema", username: "admin", password: "admin123", role: "admin", initials: "AS", roleLabel: "Administrador" },
  { id: 2, name: "Carlos Mamani", username: "carlos", password: "carlos123", role: "control", initials: "CM", roleLabel: "Resp. Control", areas: ["Recepción MP", "Sancochado", "Empaque y Sellado"] },
  { id: 3, name: "Rosa Vaca Méndez", username: "rosa", password: "rosa123", role: "seguimiento", initials: "RV", roleLabel: "Resp. Seguimiento" },
];

// ─── AREAS & ITEMS ─────────────────────────────────────────────────────────────
export const AREAS = [
  "Recepción MP", "Sancochado", "Secado", "Clasificado Manual",
  "Empaque y Sellado", "Almacén PT", "Laboratorio",
  "SS.HH. y Vestidores", "Comedor", "Área Externa"
];

export const ITEMS_AREA = {
  "Recepción MP": ["Piso y drenajes", "Paredes y rincones", "Mesa de recepción", "Balanza electrónica", "Contenedores MP"],
  "Sancochado": ["Autoclaves interior/exterior", "Carcasa y manómetros", "Piso y drenajes", "Canal de condensados", "Herramientas de proceso"],
  "Secado": ["Cilindros secadores", "Piso y estructura", "Transportadoras", "Ventiladores", "Contenedores de salida"],
  "Clasificado Manual": ["Mesas de clasificación", "Sillas ergonómicas", "Piso", "Paredes", "Luminarias"],
  "Empaque y Sellado": ["Mesas de trabajo", "Selladoras térmicas", "Balanzas", "Piso y paredes", "Utensilios"],
  "Almacén PT": ["Piso general", "Estanterías", "Pallets", "Paredes y techo", "Zona carga/descarga"],
  "Laboratorio": ["Mesones", "Equipos de análisis", "Refrigerador", "Piso y paredes", "Utensilios laboratorio"],
  "SS.HH. y Vestidores": ["Inodoros y lavatorios", "Duchas", "Piso y desagüe", "Paredes", "Casilleros"],
  "Comedor": ["Mesas y sillas", "Piso", "Paredes", "Utensilios", "Microondas/cocina"],
  "Área Externa": ["Patio", "Zona residuos", "Accesos", "Cerco perimetral", "Alrededores"],
};

// ─── STATUS MAPS ───────────────────────────────────────────────────────────────
export const STATUS = {
  borrador: { label: "Borrador", bg: "var(--status-draft-bg)", text: "var(--status-draft-text)", dot: "var(--status-draft-dot)", cls: "status-draft" },
  firmado_control: { label: "Pend. Verificación", bg: "var(--status-pending-bg)", text: "var(--status-pending-text)", dot: "var(--status-pending-dot)", cls: "status-pending" },
  aprobado: { label: "Aprobado", bg: "var(--status-approved-bg)", text: "var(--status-approved-text)", dot: "var(--status-approved-dot)", cls: "status-approved" },
  rechazado: { label: "Rechazado", bg: "var(--status-rejected-bg)", text: "var(--status-rejected-text)", dot: "var(--status-rejected-dot)", cls: "status-rejected" },
};

export const PERSONNEL_STATUS = {
  autorizado: { cls: "status-approved" },
  pendiente: { cls: "status-pending" },
  suspendido: { cls: "status-rejected" },
};

export const SUPPLY_STATUS = {
  aprobado: { cls: "status-approved" },
  condicionado: { cls: "status-pending" },
  rechazado: { cls: "status-rejected" },
};

// ─── INITIAL DATA ──────────────────────────────────────────────────────────────
export const INIT_RECORDS = [
  { id: "RC.LD.01-2026-001", area: "Recepción MP", mes: "Mayo 2026", respControl: "Carlos Mamani", respSeg: "Rosa Vaca Méndez", estado: "aprobado", fecha: "2026-05-05", resultado: "conforme", correccion: "", liberacion: "si", firmaCtrl: true, firmaSeg: true, obs: "Sin novedad. Área conforme." },
  { id: "RC.LD.01-2026-002", area: "Sancochado", mes: "Mayo 2026", respControl: "Carlos Mamani", respSeg: "Rosa Vaca Méndez", estado: "firmado_control", fecha: "2026-05-07", resultado: "no_conforme", correccion: "Segunda limpieza autoclave 2 realizada.", liberacion: "si", firmaCtrl: true, firmaSeg: false, obs: "Residuo en autoclave 2." },
  { id: "RC.LD.01-2026-003", area: "Secado", mes: "Mayo 2026", respControl: "Luis Torres", respSeg: "Rosa Vaca Méndez", estado: "borrador", fecha: "2026-05-08", resultado: "", correccion: "", liberacion: "", firmaCtrl: false, firmaSeg: false, obs: "" },
  { id: "RC.LD.01-2026-004", area: "Empaque y Sellado", mes: "Mayo 2026", respControl: "Carlos Mamani", respSeg: "Rosa Vaca Méndez", estado: "rechazado", fecha: "2026-05-06", resultado: "no_conforme", correccion: "", liberacion: "no", firmaCtrl: true, firmaSeg: true, obs: "Área no apta. Requiere nueva limpieza profunda." },
  { id: "RC.LD.01-2026-005", area: "Almacén PT", mes: "Mayo 2026", respControl: "Carlos Mamani", respSeg: "Rosa Vaca Méndez", estado: "aprobado", fecha: "2026-05-04", resultado: "conforme", correccion: "", liberacion: "si", firmaCtrl: true, firmaSeg: true, obs: "" },
];

export const INIT_PERSONNEL = [
  { id: 1, nombre: "Carlos Mamani", cargo: "Operario de Planta A", telefono: "7521-3456", fechaAut: "2026-01-15", codCap: "CAP-2026-001", fechaCap: "2026-01-10", msds: true, epp: true, noMezcla: true, vigencia: "2026-12-31", estado: "autorizado", autorizadoPor: "Rosa Vaca M." },
  { id: 2, nombre: "Rosa Vaca Méndez", cargo: "Jefe de Calidad", telefono: "7654-9876", fechaAut: "2026-01-15", codCap: "CAP-2026-001", fechaCap: "2026-01-10", msds: true, epp: true, noMezcla: true, vigencia: "2026-12-31", estado: "autorizado", autorizadoPor: "Gerencia" },
  { id: 3, nombre: "Ana Flores Quispe", cargo: "Auxiliar de Limpieza", telefono: "7123-4567", fechaAut: "2026-02-01", codCap: "CAP-2026-003", fechaCap: "2026-01-28", msds: true, epp: false, noMezcla: true, vigencia: "2026-05-31", estado: "pendiente", autorizadoPor: "Rosa Vaca M." },
  { id: 4, nombre: "Jorge Pinto Barrientos", cargo: "Operario de Proceso", telefono: "7987-6543", fechaAut: "2025-11-01", codCap: "CAP-2025-008", fechaCap: "2025-10-28", msds: true, epp: true, noMezcla: false, vigencia: "2026-04-30", estado: "suspendido", autorizadoPor: "Rosa Vaca M." },
];

export const INIT_SUPPLIES = [
  { id: 1, codigo: "IN-001", nombre: "Jabón Yodado", unidad: "Litro", proveedor: "Quimbol Bolivia SRL", ingrediente: "Yodo-PVP 1%", conc: "1% p/v", apta: true, superficie: "Contacto directo con alimento", ft: true, msds: true, lote: "JY-2026-03", venc: "2027-03-01", estado: "aprobado" },
  { id: 2, codigo: "IN-002", nombre: "Detergente Ace Patito", unidad: "Kg", proveedor: "Distribuidora Central", ingrediente: "Tensoactivos aniónicos 15%", conc: "100% polvo", apta: false, superficie: "Pisos y paredes. NO contacto con alimento.", ft: true, msds: true, lote: "ACE-2026-02", venc: "2027-06-01", estado: "condicionado" },
  { id: 3, codigo: "IN-003", nombre: "Peracetic Sanitizer FP 15", unidad: "Litro", proveedor: "FoodTech Bolivia", ingrediente: "Ácido peracético 15%", conc: "15% p/v", apta: true, superficie: "Todas superficies contacto con alimento", ft: true, msds: true, lote: "FP15-2026-04", venc: "2026-04-30", estado: "rechazado" },
  { id: 4, codigo: "IN-004", nombre: "Alcohol Etílico Guabirá 96°", unidad: "Litro", proveedor: "Industrias Guabirá", ingrediente: "Etanol 96°GL", conc: "96% v/v", apta: true, superficie: "Equipos, superficies no porosas", ft: true, msds: true, lote: "ALC-2026-05", venc: "2027-12-31", estado: "aprobado" },
  { id: 5, codigo: "IN-005", nombre: "OMO Matic Polvo", unidad: "Kg", proveedor: "Distribuidora Sur", ingrediente: "Tensoactivos aniónicos + enzimas", conc: "100% polvo", apta: false, superficie: "Ropa de trabajo, no superficies de planta", ft: false, msds: false, lote: "OMO-2026-01", venc: "2027-01-01", estado: "condicionado" },
];

// ─── DOCS DATA ─────────────────────────────────────────────────────────────────
export const DOCS_DATA = [
  { cod: "PR.LD.01", nom: "Procedimiento de Limpieza y Desinfección", rev: "Rev. 03", estado: "cumple", brecha: "Falta: colores por área, post-limpieza, pre-arranque explícito" },
  { cod: "PL.LD.01", nom: "Plan de Limpieza y Desinfección", rev: "Rev. 02", estado: "parcial", brecha: "Solo 32 de 41 áreas. PL.LD.15 en Rev.01. Sin columna post-limpieza/pre-arranque" },
  { cod: "IT.LD.01", nom: "Instructivo Preparación de Soluciones", rev: "Rev. 02", estado: "parcial", brecha: "Falta concentración objetivo en ppm para FP 15. Validar grado alim. detergentes domésticos" },
  { cod: "RC.LD.01", nom: "Registro L&D (todas las áreas)", rev: "Rev. 03", estado: "parcial", brecha: "Sin campo corrección inmediata, sin liberación pre-arranque explícita → corregido en esta app" },
  { cod: "RC.LD.02", nom: "Personal Autorizado Depósito Materiales", rev: "Rev. 02", estado: "parcial", brecha: "Falta evidencia de capacitación y vigencia de autorización" },
  { cod: "RC.LD.03", nom: "Lista de Insumos L&D", rev: "Rev. 01", estado: "parcial", brecha: "Falta: grado alimenticio, ingrediente activo, lote, vencimiento, MSDS por insumo" },
  { cod: "DT.LD.01", nom: "Validación Reducción de Microorganismos", rev: "Rev. 01", estado: "parcial", brecha: "Actualizar para FP 15. Ampliar puntos de muestreo. Agregar criterios de aceptación." },
  { cod: "DT.LD.02", nom: "Validación de Residualidad", rev: "—", estado: "falta", brecha: "No adjuntado. Crítico para FP 15 y jabón yodado en superficies de contacto." },
];

// ─── NAV ITEMS ─────────────────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "rcld01", label: "RC.LD.01 Limpieza", icon: "cleaning" },
  { id: "rcld02", label: "RC.LD.02 Personal", icon: "people" },
  { id: "rcld03", label: "RC.LD.03 Insumos", icon: "inventory" },
  { id: "docs", label: "Documentos", icon: "docs" },
  { id: "config", label: "Configuración", icon: "settings" },
];
