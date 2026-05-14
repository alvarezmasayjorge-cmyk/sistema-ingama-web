import { useRef, useState, useCallback } from "react";

/**
 * SignatureBox — Componente de firma digital mejorado
 * Soporta:
 * - Modo rápido: botón "Firmar" que registra nombre + fecha/hora + rol
 * - Modo canvas: dibujar firma manualmente
 * - Confirmación visual clara
 * - Limpiar/repetir antes de guardar
 * - Responsive para tablet y celular
 * 
 * Formato de firma guardada:
 * { firmado: true, nombre: string, rol: string, fechaHora: string, tipo: "digital"|"canvas", dataUrl?: string }
 */
export default function SignatureBox({ label, signature, onSign, canSign, signerName, signerRole }) {
  const [mode, setMode] = useState(null); // null | "quick" | "canvas"
  const ref = useRef(null);
  const drawing = useRef(false);

  const fmtDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" }) +
      " " + d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
  };

  const roleLabels = {
    admin: "Administrador",
    control: "Resp. Control",
    seguimiento: "Resp. Seguimiento",
  };

  // ─── CANVAS HANDLERS ────────────────────────────────────────────────
  const getPos = useCallback((e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const ev = e.touches ? e.touches[0] : e;
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }, []);

  const handleStart = useCallback((e) => {
    if (!canSign) return;
    e.preventDefault();
    drawing.current = true;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, [canSign, getPos]);

  const handleMove = useCallback((e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [getPos]);

  const handleStop = useCallback(() => { drawing.current = false; }, []);

  const handleClear = useCallback(() => {
    const canvas = ref.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleCanvasConfirm = useCallback(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasDrawing = imageData.data.some((channel, index) => index % 4 === 3 && channel > 0);
    if (!hasDrawing) return;
    onSign({
      firmado: true,
      nombre: signerName,
      rol: signerRole || "control",
      fechaHora: new Date().toISOString(),
      tipo: "canvas",
      dataUrl: canvas.toDataURL(),
    });
    setMode(null);
  }, [onSign, signerName, signerRole]);

  const handleQuickSign = useCallback(() => {
    onSign({
      firmado: true,
      nombre: signerName,
      rol: signerRole || "control",
      fechaHora: new Date().toISOString(),
      tipo: "digital",
    });
    setMode(null);
  }, [onSign, signerName, signerRole]);

  // ─── RENDER: YA FIRMADO ─────────────────────────────────────────────
  if (signature && signature.firmado) {
    return (
      <div className="sig-box sig-box-signed">
        <div className="sig-box-header">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round">
            <circle cx="9" cy="9" r="8" opacity="0.15" fill="var(--color-success)" />
            <path d="M6 9l2 2 4-4" />
          </svg>
          <span className="sig-box-title">✓ Firmado</span>
        </div>
        <div className="sig-box-details">
          <div className="sig-box-field">
            <span className="sig-box-label">Responsable:</span>
            <span className="sig-box-value">{signature.nombre}</span>
          </div>
          <div className="sig-box-field">
            <span className="sig-box-label">Rol:</span>
            <span className="sig-box-value">{roleLabels[signature.rol] || signature.rol}</span>
          </div>
          <div className="sig-box-field">
            <span className="sig-box-label">Fecha/Hora:</span>
            <span className="sig-box-value">{fmtDateTime(signature.fechaHora)}</span>
          </div>
          <div className="sig-box-field">
            <span className="sig-box-label">Tipo:</span>
            <span className="sig-box-value">{signature.tipo === "canvas" ? "Firma manuscrita" : "Firma digital"}</span>
          </div>
        </div>
        {signature.dataUrl && (
          <div className="sig-box-preview">
            <img src={signature.dataUrl} alt="Firma" />
          </div>
        )}
      </div>
    );
  }

  // ─── RENDER: PENDIENTE (NO PUEDE FIRMAR) ────────────────────────────
  if (!canSign) {
    return (
      <div className="sig-box sig-box-pending">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35">
          <circle cx="12" cy="12" r="10" strokeDasharray="4 2" />
          <path d="M12 8v4M10 16h4" strokeLinecap="round" />
        </svg>
        <p className="sig-box-pending-text">Pendiente de firma</p>
        <p className="sig-box-pending-label">{label}</p>
      </div>
    );
  }

  // ─── RENDER: MODO CANVAS ────────────────────────────────────────────
  if (mode === "canvas") {
    return (
      <div className="sig-box sig-box-active">
        <p className="sig-box-active-label">{label} — Dibuje su firma:</p>
        <p className="sig-box-signer">Firmante: <strong>{signerName}</strong> ({roleLabels[signerRole] || signerRole})</p>
        <canvas
          ref={ref}
          width={320}
          height={100}
          className="sig-canvas"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleStop}
          onMouseLeave={handleStop}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleStop}
        />
        <div className="sig-box-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => { handleClear(); setMode(null); }}>
            Cancelar
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleClear}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1l12 12M13 1L1 13"/></svg>
            Limpiar
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleCanvasConfirm}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 7l3 3 5-5"/></svg>
            Confirmar Firma
          </button>
        </div>
      </div>
    );
  }

  // ─── RENDER: SELECTOR DE MODO ───────────────────────────────────────
  return (
    <div className="sig-box sig-box-select">
      <p className="sig-box-select-label">{label}</p>
      <p className="sig-box-signer">Firmante: <strong>{signerName}</strong></p>
      <div className="sig-box-options">
        <button className="sig-option-btn sig-option-quick" onClick={handleQuickSign}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="10" cy="10" r="9" />
            <path d="M7 10l2 2 4-4" />
          </svg>
          <div>
            <span className="sig-option-title">Firma Rápida</span>
            <span className="sig-option-desc">Registra nombre, rol y fecha/hora</span>
          </div>
        </button>
        <button className="sig-option-btn sig-option-canvas" onClick={() => setMode("canvas")}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M13 3l4 4L6 18H2v-4L13 3z" />
          </svg>
          <div>
            <span className="sig-option-title">Firma Manuscrita</span>
            <span className="sig-option-desc">Dibuje su firma con el dedo o ratón</span>
          </div>
        </button>
      </div>
    </div>
  );
}
