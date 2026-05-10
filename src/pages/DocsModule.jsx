import { DOCS_DATA } from "../data/initial";

const ESTADO_ICONS = { cumple: "✅", parcial: "⚠️", falta: "❌" };
const ESTADO_LABELS = { cumple: "Cumple", parcial: "Cumple parcial", falta: "No verificado" };

export default function DocsModule() {
  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documentos del Sistema L&D</h1>
          <p className="page-subtitle">Mapa documental · Informe de conformidad ISO/TS 22002-1 §11</p>
        </div>
        <span className="badge badge-primary">ISO §11</span>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              {["Código", "Documento", "Revisión", "Estado ISO §11", "Brecha Principal"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DOCS_DATA.map((d, i) => (
              <tr key={i} className="table-row-hover">
                <td className="td-mono td-bold" style={{ color: "var(--color-primary)" }}>{d.cod}</td>
                <td className="td-bold">{d.nom}</td>
                <td className="td-small">{d.rev}</td>
                <td>
                  <span className={`badge ${d.estado === "cumple" ? "badge-success" : d.estado === "parcial" ? "badge-warning" : "badge-danger"}`}>
                    {ESTADO_ICONS[d.estado]} {ESTADO_LABELS[d.estado]}
                  </span>
                </td>
                <td className="td-small">{d.brecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card card-dark">
        <h3 className="card-title" style={{ color: "#fff" }}>Relación documental del sistema</h3>
        <div className="doc-tree">
          <p><span className="doc-tree-code">PR.LD.01</span> → define el procedimiento general</p>
          <p className="doc-tree-child"><span className="doc-tree-code">IT.LD.01</span> → define preparación de soluciones</p>
          <p className="doc-tree-child"><span className="doc-tree-code">PL.LD.01</span> → qué, cómo, frecuencia, responsables, agentes</p>
          <p className="doc-tree-grandchild"><span className="doc-tree-code">RC.LD.01</span> → ejecución, verificación, liberación <span className="badge badge-sm badge-primary">esta app</span></p>
          <p><span className="doc-tree-code">RC.EP.09</span> → recepción de materiales e insumos</p>
          <p className="doc-tree-child"><span className="doc-tree-code">RC.LD.03</span> → lista maestra de insumos aprobados</p>
          <p><span className="doc-tree-code">RC.LD.02</span> → personal autorizado al depósito de materiales</p>
        </div>
      </div>
    </div>
  );
}
