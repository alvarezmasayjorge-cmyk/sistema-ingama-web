import { useMemo } from "react";
import {
  calculateAreaRisks,
  generateRecommendations,
  predictCompliance,
  analyzeObservations,
  calculatePersonnelScores,
  detectAnomalies,
  recommendFrequency,
  analyzeSupplies,
} from "../utils/aiEngine";

const PRIORITY_STYLE = {
  alta: { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", dot: "#ef4444" },
  media: { bg: "#fffbeb", border: "#fde68a", text: "#d97706", dot: "#f59e0b" },
  baja: { bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a", dot: "#22c55e" },
};

const TREND_ICON = {
  "↗": { icon: "↗", color: "#10b981" },
  "↘": { icon: "↘", color: "#ef4444" },
  "→": { icon: "→", color: "#94a3b8" },
};

// ─── Iconos SVG inline ─────────────────────────────────────────────────────
const Icon = ({ name, size = 14, color = "currentColor", strokeWidth = 1.8 }) => {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    sparkle: <><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4l12.8-12.8" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    crystal: <><path d="M12 2l7 7-7 13L5 9l7-7z" /><path d="M5 9h14" /></>,
    lightbulb: <><path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.5.4.8 1 .8 1.6V18h6.4v-1.7c0-.6.3-1.2.8-1.6A7 7 0 0012 2z" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0116 0v1" /></>,
    alert: <><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    flask: <><path d="M9 3h6M10 3v6L4.5 19a2 2 0 001.7 3h11.6a2 2 0 001.7-3L14 9V3" /></>,
    check: <><polyline points="20 6 9 17 4 12" /></>,
    block: <><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></>,
    warning: <><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="9" /></>,
    x: <><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></>,
    doc: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></>,
    edit: <><path d="M12 20h9M16.5 3.5a2 2 0 012.8 2.8L7 19l-4 1 1-4 12.5-12.5z" /></>,
  };
  return <svg {...props}>{paths[name] || null}</svg>;
};

const sectionStyle = {
  background: "rgba(255,255,255,0.04)",
  borderRadius: 12,
  padding: 14,
  border: "1px solid rgba(255,255,255,0.06)",
};
const labelStyle = {
  color: "rgba(255,255,255,0.6)",
  fontSize: 11,
  fontWeight: 600,
  marginBottom: 10,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  display: "flex",
  alignItems: "center",
  gap: 7,
};

const SectionLabel = ({ icon, children }) => (
  <p style={labelStyle}>
    <Icon name={icon} size={12} color="rgba(255,255,255,0.6)" />
    {children}
  </p>
);

const ISSUE_ICON_MAP = {
  "Vencidos": "block",
  "Vencen en <45 días": "clock",
  "Condicionados": "warning",
  "Rechazados": "x",
  "Sin documentación completa": "doc",
};

const REC_ICON_MAP = {
  "Registros": "doc",
  "Hisopados ATP": "flask",
  "Personal": "user",
  "Insumos": "flask",
  "Pendientes": "edit",
  "Sistema": "check",
};

export default function AIInsights({ records, personnel, supplies, rcma9 }) {
  const areaRisks = useMemo(() => calculateAreaRisks(records, rcma9), [records, rcma9]);
  const recommendations = useMemo(
    () => generateRecommendations(records, personnel, supplies, rcma9),
    [records, personnel, supplies, rcma9]
  );
  const prediction = useMemo(() => predictCompliance(records), [records]);
  const obsAnalysis = useMemo(() => analyzeObservations(records), [records]);
  const personnelScores = useMemo(() => calculatePersonnelScores(records, personnel), [records, personnel]);
  const anomalies = useMemo(() => detectAnomalies(records), [records]);
  const frequencyRecs = useMemo(() => recommendFrequency(records, areaRisks), [records, areaRisks]);
  const suppliesAnalysis = useMemo(() => analyzeSupplies(supplies), [supplies]);

  const topRisks = areaRisks.slice(0, 4);
  const highRiskCount = areaRisks.filter((a) => a.level === "critico" || a.level === "alto").length;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
        borderRadius: 16,
        padding: "24px",
        marginTop: 24,
        border: "1px solid rgba(59,130,246,0.2)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decoración */}
      <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: "rgba(59,130,246,0.08)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -40, left: -40, width: 150, height: 150, background: "rgba(16,185,129,0.06)", borderRadius: "50%", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(59,130,246,0.4)",
              color: "#fff",
            }}
          >
            <Icon name="sparkle" size={20} color="#fff" strokeWidth={2} />
          </div>
          <div>
            <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
              Análisis Predictivo
            </h3>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: 0 }}>
              Motor IA · 8 algoritmos analizando tus datos en tiempo real
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {highRiskCount > 0 && (
            <span style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
              {highRiskCount} área(s) en riesgo
            </span>
          )}
          <span style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)", color: "#93c5fd", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, letterSpacing: "0.04em" }}>
            IA GRATIS
          </span>
        </div>
      </div>

      {/* ─── SECCIÓN 1: Riesgo + Predicción + Recomendaciones ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={sectionStyle}>
          <SectionLabel icon="target">Mapa de Riesgo por Área</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {topRisks.map((area, i) => {
              const t = TREND_ICON[area.trend] || TREND_ICON["→"];
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <span style={{ color: "#fff", fontSize: 11, fontWeight: 500, maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {area.area.length > 28 ? area.area.slice(0, 25) + "…" : area.area}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: t.color, fontSize: 13, fontWeight: 700 }}>{t.icon}</span>
                      <span style={{ background: area.levelColor + "22", color: area.levelColor, border: `1px solid ${area.levelColor}44`, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 12 }}>
                        {area.levelLabel}
                      </span>
                      <span style={{ color: area.levelColor, fontSize: 12, fontWeight: 700, minWidth: 28, textAlign: "right" }}>{area.score}%</span>
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${area.score}%`, height: "100%", background: `linear-gradient(90deg, ${area.levelColor}99, ${area.levelColor})`, borderRadius: 4, transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                  </div>
                  {area.reason !== "Sin alertas detectadas" && (
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 3 }}>{area.reason}</p>
                  )}
                </div>
              );
            })}
            {areaRisks.length === 0 && <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>Sin datos suficientes para análisis</p>}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={sectionStyle}>
            <SectionLabel icon="crystal">Predicción Próximo Período</SectionLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
                <svg width="52" height="52" viewBox="0 0 52 52">
                  <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                  <circle
                    cx="26" cy="26" r="22" fill="none"
                    stroke={prediction.predicted >= 70 ? "#10b981" : prediction.predicted >= 40 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="4"
                    strokeDasharray={`${prediction.predicted * 1.382} 200`}
                    strokeLinecap="round"
                    transform="rotate(-90 26 26)"
                    style={{ transition: "stroke-dasharray 1s ease" }}
                  />
                </svg>
                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800 }}>{prediction.predicted}%</span>
              </div>
              <div>
                <p style={{ color: "#fff", fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>Conformidad estimada</p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: 0 }}>
                  Tendencia:{" "}
                  <span style={{ color: prediction.trend === "mejorando" ? "#10b981" : prediction.trend === "empeorando" ? "#ef4444" : "#94a3b8", fontWeight: 600 }}>
                    {prediction.trend}
                  </span>
                </p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, margin: "3px 0 0" }}>Confianza: {prediction.confidence}%</p>
              </div>
            </div>
          </div>

          <div style={{ ...sectionStyle, flex: 1 }}>
            <SectionLabel icon="lightbulb">Recomendaciones IA</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recommendations.slice(0, 3).map((rec, i) => {
                const s = PRIORITY_STYLE[rec.priority];
                const iconName = REC_ICON_MAP[rec.category] || "doc";
                return (
                  <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: "8px 10px", display: "flex", alignItems: "flex-start", gap: 9 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: s.dot + "22", border: `1px solid ${s.dot}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: s.dot }}>
                      <Icon name={iconName} size={13} color={s.dot} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4 }}>
                        <span style={{ color: s.text, fontSize: 11, fontWeight: 700 }}>{rec.category}</span>
                        <span style={{ background: s.dot + "22", color: s.dot, fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 10, border: `1px solid ${s.dot}44`, textTransform: "uppercase", flexShrink: 0 }}>
                          {rec.priority}
                        </span>
                      </div>
                      <p style={{ color: "#374151", fontSize: 11, margin: "2px 0 0", lineHeight: 1.3 }}>{rec.text}</p>
                      <p style={{ color: "#6b7280", fontSize: 10, margin: "2px 0 0", fontStyle: "italic" }}>→ {rec.action}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Divisor */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 16px" }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em" }}>ANÁLISIS AVANZADO</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
      </div>

      {/* ─── SECCIÓN 2: NLP + Personal + Anomalías ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={sectionStyle}>
          <SectionLabel icon="search">Problemas Detectados (NLP)</SectionLabel>
          {obsAnalysis.topCategories.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Sin observaciones para analizar</p>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
                {obsAnalysis.topCategories.slice(0, 4).map((cat, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, flexShrink: 0, boxShadow: `0 0 8px ${cat.color}66` }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ color: "#fff", fontSize: 10, fontWeight: 500, textTransform: "capitalize" }}>{cat.category}</span>
                        <span style={{ color: cat.color, fontSize: 10, fontWeight: 700 }}>{cat.count}x</span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 3, height: 3, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(100, cat.count * 25)}%`, height: "100%", background: cat.color, transition: "width 0.8s ease" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {obsAnalysis.topWords.length > 0 && (
                <div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 600, marginBottom: 5, letterSpacing: "0.05em" }}>PALABRAS FRECUENTES</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {obsAnalysis.topWords.map((w, i) => (
                      <span key={i} style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: 9, padding: "2px 7px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)" }}>
                        {w.word} <span style={{ color: "#93c5fd", fontWeight: 700 }}>·{w.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, marginTop: 8 }}>
                Analizadas {obsAnalysis.totalObservations} observación(es)
              </p>
            </>
          )}
        </div>

        <div style={sectionStyle}>
          <SectionLabel icon="user">Ranking de Personal</SectionLabel>
          {personnelScores.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Sin datos de personal</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {personnelScores.slice(0, 4).map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${p.color}, ${p.color}cc)`,
                    color: "#fff", fontSize: 10, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#fff", fontSize: 10, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.nombre.split(" ").slice(0, 2).join(" ")}
                      </span>
                      <span style={{ color: p.color, fontSize: 11, fontWeight: 700 }}>{p.score}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 9 }}>{p.total} registros</span>
                      <span style={{ background: p.color + "22", color: p.color, fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 8 }}>
                        {p.level}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={sectionStyle}>
          <SectionLabel icon="alert">Detección de Anomalías</SectionLabel>
          {anomalies.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", gap: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="check" size={18} color="#10b981" strokeWidth={2.5} />
              </div>
              <p style={{ color: "#10b981", fontSize: 11, fontWeight: 600, margin: 0 }}>Sin anomalías detectadas</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, margin: 0 }}>Sistema operando normalmente</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {anomalies.slice(0, 4).map((a, i) => {
                const sevColor = a.severity === "alta" ? "#ef4444" : a.severity === "media" ? "#f59e0b" : "#94a3b8";
                return (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderLeft: `3px solid ${sevColor}`, borderRadius: 6, padding: "6px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: sevColor, flexShrink: 0 }} />
                      <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>{a.title}</span>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, margin: 0, lineHeight: 1.3 }}>{a.detail}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── SECCIÓN 3: Frecuencia + Insumos ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={sectionStyle}>
          <SectionLabel icon="calendar">Frecuencia Recomendada por Área</SectionLabel>
          {frequencyRecs.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Sin datos suficientes</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {frequencyRecs.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < frequencyRecs.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{
                    width: 38, textAlign: "center",
                    background: f.color + "22", border: `1px solid ${f.color}44`,
                    color: f.color, fontWeight: 800, fontSize: 11,
                    padding: "4px 0", borderRadius: 8, flexShrink: 0,
                  }}>
                    {f.suggestedDays}d
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#fff", fontSize: 10, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.area.length > 30 ? f.area.slice(0, 27) + "…" : f.area}
                      </span>
                      {f.status === "atrasado" && (
                        <span style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 8, textTransform: "uppercase" }}>
                          Atrasado
                        </span>
                      )}
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, margin: "1px 0 0" }}>{f.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={sectionStyle}>
          <SectionLabel icon="flask">Salud del Inventario de Insumos</SectionLabel>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="24" fill="none"
                  stroke={suppliesAnalysis.healthScore >= 70 ? "#10b981" : suppliesAnalysis.healthScore >= 40 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="4"
                  strokeDasharray={`${suppliesAnalysis.healthScore * 1.508} 200`}
                  strokeLinecap="round"
                  transform="rotate(-90 28 28)"
                  style={{ transition: "stroke-dasharray 1s ease" }}
                />
              </svg>
              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 800 }}>
                {suppliesAnalysis.healthScore}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "#fff", fontSize: 12, fontWeight: 600, margin: "0 0 2px" }}>Health Score</p>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, margin: 0 }}>
                {suppliesAnalysis.summary?.total || 0} insumo(s) · {suppliesAnalysis.summary?.aprobados || 0} aprobados
              </p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, margin: "2px 0 0" }}>
                Basado en estado, vigencia y documentación
              </p>
            </div>
          </div>
          {suppliesAnalysis.issues.length === 0 ? (
            <p style={{ color: "#10b981", fontSize: 10, textAlign: "center", padding: "8px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon name="check" size={12} color="#10b981" strokeWidth={2.5} /> Inventario sin alertas
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {suppliesAnalysis.issues.slice(0, 3).map((issue, i) => {
                const sevColor = issue.severity === "alta" ? "#ef4444" : issue.severity === "media" ? "#f59e0b" : "#94a3b8";
                const iconName = ISSUE_ICON_MAP[issue.label] || "warning";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", background: "rgba(255,255,255,0.03)", borderRadius: 6, borderLeft: `2px solid ${sevColor}` }}>
                    <div style={{ width: 22, height: 22, borderRadius: 5, background: sevColor + "22", border: `1px solid ${sevColor}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: sevColor }}>
                      <Icon name={iconName} size={11} color={sevColor} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>{issue.label}</span>
                        <span style={{ color: sevColor, fontSize: 10, fontWeight: 700 }}>{issue.count}</span>
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {issue.items.join(", ")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, textAlign: "right", marginTop: 16, letterSpacing: "0.02em" }}>
        8 algoritmos · {records.length} registros · {personnel.length} personas · {supplies.length} insumos · Actualizado en tiempo real
      </p>
    </div>
  );
}
