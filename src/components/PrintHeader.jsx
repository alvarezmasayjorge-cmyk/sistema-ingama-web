import { DOC_INFO } from "../data/areasConfig";

/**
 * PrintHeader — Encabezado oficial para documentos impresos
 * Replica la estructura: Logo | Título | Código | Rev | Vigencia
 */
export default function PrintHeader({ docCode = "RC.LD.01", areaName = "", mes = "" }) {
  const info = DOC_INFO[docCode] || {
    titulo: "Registro",
    revision: "Rev. 01",
    vigencia: "2026",
    norma: "FSSC 22000 v6",
  };

  return (
    <div className="print-only print-header-official">
      <table className="print-header-table">
        <tbody>
          <tr>
            <td rowSpan={3} className="print-header-logo-cell">
              <img src="/logo.png" alt="INGAMA" className="print-logo" />
              <span className="print-company">BENEFICIADORA INGAMA</span>
            </td>
            <td className="print-header-center" rowSpan={2}>
              <strong>REGISTRO</strong><br />
              <span>{info.titulo.toUpperCase()}</span>
            </td>
            <td className="print-header-right">{docCode}</td>
          </tr>
          <tr>
            <td className="print-header-right">{info.revision}</td>
          </tr>
          <tr>
            <td className="print-header-center-small">
              <span>ISO 22002-1 · ISO 22000</span>
            </td>
            <td className="print-header-right">Vigente: {info.vigencia}</td>
          </tr>
        </tbody>
      </table>
      {areaName && (
        <div className="print-header-area">
          <strong>ÁREA:</strong> {areaName}
          {mes && <span style={{ marginLeft: 24 }}><strong>MES:</strong> {mes}</span>}
        </div>
      )}
    </div>
  );
}
