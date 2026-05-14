// ─── DATE HELPERS ──────────────────────────────────────────────────────────────
export const fmtDate = (d) => {
  if (!d) return "—";
  // Toma solo la parte de fecha si viene con hora (ISO completo)
  const datePart = String(d).split("T")[0];
  const [y, m, day] = datePart.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
};

export const getToday = () => new Date();

export const isExpired = (d) => d && new Date(d) < getToday();

export const isSoon = (d) => {
  if (!d) return false;
  const diff = (new Date(d) - getToday()) / 86400000;
  return diff >= 0 && diff <= 45;
};

// Devuelve YYYY-MM-DD en hora local (evita desfase UTC)
export const todayISO = () => {
  const d = getToday();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const fmtDateLong = () => {
  return getToday().toLocaleDateString("es-BO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ─── ID HELPERS ────────────────────────────────────────────────────────────────
// Parse the numeric suffix from the last segment of an ID string
const parseIdNum = (id) => {
  const parts = id.split("-");
  return parseInt(parts[parts.length - 1], 10) || 0;
};

export const newRecordId = (records) => {
  const max = records.reduce((m, r) => Math.max(m, parseIdNum(r.id)), 0);
  return `RC.LD.01-2026-${String(max + 1).padStart(3, "0")}`;
};

export const newRcma9Id = (records) => {
  const max = records.reduce((m, r) => Math.max(m, parseIdNum(r.id)), 0);
  return `RC.MA.09-2026-${String(max + 1).padStart(3, "0")}`;
};

export const newSupplyCode = (supplies) => {
  const max = supplies.reduce((m, s) => {
    const n = parseInt((s.codigo || "").replace("IN-", ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `IN-${String(max + 1).padStart(3, "0")}`;
};

export const newPersonnelId = (personnel) =>
  personnel.reduce((m, p) => Math.max(m, p.id || 0), 0) + 1;

export const newSupplyId = (supplies) =>
  supplies.reduce((m, s) => Math.max(m, s.id || 0), 0) + 1;

// ─── MONTH HELPERS ─────────────────────────────────────────────────────────────
export const getCurrentMonth = () => {
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const d = getToday();
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};
