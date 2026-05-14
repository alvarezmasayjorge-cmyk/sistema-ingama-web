const STATUS_MAP = {
  borrador: { label: "Borrador", cls: "status-draft" },
  firmado_control: { label: "Pend. Verificación", cls: "status-pending" },
  aprobado: { label: "Aprobado", cls: "status-approved" },
  rechazado: { label: "Rechazado", cls: "status-rejected" },
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  // Accept both string ("aprobado") and object ({ cls, label })
  const resolved = typeof status === "string" ? STATUS_MAP[status] : status;
  if (!resolved) return null;
  return (
    <span className={`status-badge ${resolved.cls}`}>
      <span className="status-dot" />
      {resolved.label}
    </span>
  );
}
