export default function ConfigModule() {
  const sections = [
    { title: "Áreas de planta", desc: "Gestionar las 10 áreas del plan de limpieza", icon: "plant" },
    { title: "Frecuencias", desc: "Diaria, semanal, quincenal, mensual", icon: "freq" },
    { title: "Usuarios y roles", desc: "Administrador, Control, Seguimiento", icon: "users" },
    { title: "Códigos documentales", desc: "Taxonomy: MA/PR/IT/PL/RC/DC", icon: "codes" },
    { title: "Períodos de vigencia", desc: "Vigencias de autorizaciones", icon: "calendar" },
    { title: "Exportación PDF", desc: "Configurar encabezado y logo", icon: "pdf" },
  ];

  const icons = {
    plant: <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="14" width="22" height="10" rx="2"/><path d="M7 14V8a2 2 0 012-2h10a2 2 0 012 2v6"/><path d="M14 6V3"/></svg>,
    freq: <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="14" cy="14" r="11"/><path d="M14 7v7l4 4"/></svg>,
    users: <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="8" r="4"/><path d="M2 24c0-5 3.5-8 8-8s8 3 8 8"/><circle cx="21" cy="8" r="3"/><path d="M26 24c0-4-2-6-5-6"/></svg>,
    codes: <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h10l6 6v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"/><path d="M16 2v6h6"/><path d="M9 14h10M9 18h6"/></svg>,
    calendar: <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="5" width="22" height="20" rx="2"/><path d="M9 3v4M19 3v4M3 11h22"/><circle cx="9" cy="17" r="1.5" fill="currentColor"/></svg>,
    pdf: <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="2" width="20" height="24" rx="2"/><path d="M10 14h8M10 18h5"/><path d="M9 8h10" strokeWidth="2"/></svg>,
  };

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Parámetros del sistema SGIA Limpieza</p>
        </div>
      </div>

      <div className="config-grid">
        {sections.map((s) => (
          <button key={s.title} className="config-card">
            <div className="config-icon">{icons[s.icon]}</div>
            <div>
              <h4 className="config-title">{s.title}</h4>
              <p className="config-desc">{s.desc}</p>
            </div>
            <svg className="config-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 3l5 5-5 5"/></svg>
          </button>
        ))}
      </div>

      <div className="info-banner info-neutral">
        <strong>Nota:</strong> Los módulos de configuración estarán disponibles en la próxima versión. Actualmente las áreas, frecuencias y usuarios están configurados directamente en el sistema.
      </div>
    </div>
  );
}
