// ─── DATE HELPERS ──────────────────────────────────────────────────────────────
export const fmtDate = (d) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

export const getToday = () => new Date();

export const isExpired = (d) => d && new Date(d) < getToday();

export const isSoon = (d) => {
  if (!d) return false;
  const diff = (new Date(d) - getToday()) / 86400000;
  return diff >= 0 && diff <= 45;
};

export const todayISO = () => {
  const d = getToday();
  return d.toISOString().split("T")[0];
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
  Math.max(...personnel.map((p) => p.id), 0) + 1;

export const newSupplyId = (supplies) =>
  Math.max(...supplies.map((s) => s.id), 0) + 1;

// ─── MONTH HELPERS ─────────────────────────────────────────────────────────────
export const getCurrentMonth = () => {
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const d = getToday();
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};
