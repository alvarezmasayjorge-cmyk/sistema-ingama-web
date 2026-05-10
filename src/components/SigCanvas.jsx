import { useRef, useCallback } from "react";
import { fmtDate, todayISO } from "../helpers";

export default function SigCanvas({ label, signed, onSign, canSign, signerName }) {
  const ref = useRef(null);
  const drawing = useRef(false);

  const getPos = useCallback((e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const ev = e.touches ? e.touches[0] : e;
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }, []);

  const handleStart = useCallback((e) => {
    if (!canSign || signed) return;
    e.preventDefault();
    drawing.current = true;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, [canSign, signed, getPos]);

  const handleMove = useCallback((e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.strokeStyle = "var(--color-primary-dark)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [getPos]);

  const handleStop = useCallback(() => {
    drawing.current = false;
  }, []);

  const handleClear = useCallback(() => {
    const canvas = ref.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleConfirm = useCallback(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasDrawing = imageData.data.some((channel, index) => index % 4 === 3 && channel > 0);
    if (!hasDrawing) return;
    onSign(canvas.toDataURL());
  }, [onSign]);

  if (signed) {
    return (
      <div className="sig-signed">
        <div className="sig-signed-header">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="8" cy="8" r="7" opacity="0.2" fill="currentColor" />
            <path d="M5 8l2 2 4-4" />
          </svg>
          <span>Firmado: {signerName}</span>
        </div>
        <p className="sig-signed-date">{fmtDate(todayISO())} — Firma digital simple</p>
      </div>
    );
  }

  if (!canSign) {
    return (
      <div className="sig-pending">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
          <circle cx="10" cy="10" r="9" strokeDasharray="4 2" />
          <path d="M10 6v5M7 13h6" strokeLinecap="round" />
        </svg>
        <p>Pendiente de firma</p>
        <p className="sig-pending-label">{label}</p>
      </div>
    );
  }

  return (
    <div className="sig-canvas-wrapper">
      <p className="sig-canvas-label">{label} — Dibuje su firma:</p>
      <canvas
        ref={ref}
        width={320}
        height={90}
        className="sig-canvas"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleStop}
        onMouseLeave={handleStop}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleStop}
      />
      <div className="sig-canvas-actions">
        <button className="btn btn-ghost btn-sm" onClick={handleClear}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1l12 12M13 1L1 13"/></svg>
          Limpiar
        </button>
        <button className="btn btn-primary btn-sm" onClick={handleConfirm}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 7l3 3 5-5"/></svg>
          Confirmar Firma
        </button>
      </div>
    </div>
  );
}
