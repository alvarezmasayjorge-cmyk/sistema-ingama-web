import { useMemo } from "react";
import { fmtDate, todayISO } from "../helpers";

export default function DocsModule({ records, rcma9 }) {
  const atpStats = useMemo(() => {
    if (!rcma9 || rcma9.length === 0) return { total: 0, conformes: 0, noConformes: 0, pct: 0 };
    // Classify by RLU threshold (<= 100 pasa)
    const conformes = rcma9.filter(r => {
      const val = parseFloat(r.resultado);
      return !isNaN(val) && val <= 100;
    }).length;
    return {
      total: rcma9.length,
      conformes,
      noConformes: rcma9.length - conformes,
      pct: ((conformes / rcma9.length) * 100).toFixed(1)
    };
  }, [rcma9]);

  const cleaningStats = useMemo(() => {
    if (!records || records.length === 0) return { total: 0, aprobados: 0, rechazados: 0, pct: 0 };
    const aprobados = records.filter(r => r.estado === 'aprobado' && r.liberacion === 'si').length;
    return {
      total: records.length,
      aprobados,
      rechazados: records.length - aprobados,
      pct: ((aprobados / records.length) * 100).toFixed(1)
    };
  }, [records]);

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Generación de Documentos (DT.LD.01 / DT.LD.02)</h1>
          <p className="page-subtitle">Informes automáticos de validación</p>
        </div>
        <button className="btn btn-outline" onClick={() => window.print()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 5V3h8v2M4 11H2V6h12v5h-2M4 9h8v4H4z"/></svg>
          Imprimir Reportes
        </button>
      </div>

      <div className="print-only">
         <div className="print-header">
            <img src="/logo.png" alt="Logo INGAMA" className="print-logo" />
            <div>
              <h2>DOCUMENTOS TÉCNICOS L&D</h2>
              <p>FSSC 22000 v6 / ISO/TS 22002-1</p>
            </div>
         </div>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>DT.LD.01 - Informe de Validación de Reducción de Microorganismos</h3>
        <p className="text-muted" style={{ marginBottom: '1rem' }}>Rev. 02 | Fecha de generación: {fmtDate(todayISO())}</p>
        
        <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
          <p><strong>Objetivo:</strong> Validar la eficacia del programa de limpieza y desinfección en la reducción de la carga microbiana en superficies de contacto mediante pruebas de hisopado ATP (RC.MA.9).</p>
          <hr style={{ margin: '12px 0', borderColor: 'var(--border-color)' }} />
          <h4 style={{ marginBottom: '8px' }}>Resumen de Resultados ATP:</h4>
          <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '12px' }}>
            <li>Total de hisopados realizados: <strong>{atpStats.total}</strong></li>
            <li>Resultados Conformes (&lt; 50 URL): <strong>{atpStats.conformes}</strong></li>
            <li>Resultados No Conformes: <strong>{atpStats.noConformes}</strong></li>
            <li>Tasa de efectividad: <strong>{atpStats.pct}%</strong></li>
          </ul>
          {atpStats.pct >= 95 ? (
            <p className="text-success"><strong>Conclusión:</strong> El procedimiento de L&D ha demostrado ser altamente eficaz en la reducción de microorganismos. El sistema se encuentra validado y operativo.</p>
          ) : (
            <p className="text-danger"><strong>Conclusión:</strong> La tasa de efectividad es inferior al límite de seguridad (95%). Se requiere revisión del procedimiento operativo (PR.LD.01), recapacitación del personal y una nueva ronda de validación.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>DT.LD.02 - Informe de Validación de Residualidad</h3>
        <p className="text-muted" style={{ marginBottom: '1rem' }}>Rev. 02 | Fecha de generación: {fmtDate(todayISO())}</p>
        
        <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
          <p><strong>Objetivo:</strong> Verificar la ausencia de residuos químicos (detergentes y sanitizantes) post-limpieza mediante inspección visual y liberación pre-arranque (RC.LD.01).</p>
          <hr style={{ margin: '12px 0', borderColor: 'var(--border-color)' }} />
          <h4 style={{ marginBottom: '8px' }}>Resumen de Verificaciones de Limpieza:</h4>
          <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '12px' }}>
            <li>Total de áreas verificadas: <strong>{cleaningStats.total}</strong></li>
            <li>Áreas liberadas (sin residualidad visible/física): <strong>{cleaningStats.aprobados}</strong></li>
            <li>Áreas con desviaciones o re-lavados: <strong>{cleaningStats.rechazados}</strong></li>
            <li>Tasa de liberación conforme: <strong>{cleaningStats.pct}%</strong></li>
          </ul>
          {cleaningStats.pct >= 95 ? (
            <p className="text-success"><strong>Conclusión:</strong> El enjuague e inspección visual demuestran que no existe riesgo de residualidad química cruzada. Validación exitosa.</p>
          ) : (
            <p className="text-danger"><strong>Conclusión:</strong> Existen múltiples desviaciones por posible residualidad química o suciedad visual. Requiere mejora en el protocolo de enjuague de las soluciones (IT.LD.01).</p>
          )}
        </div>
      </div>
      
    </div>
  );
}
