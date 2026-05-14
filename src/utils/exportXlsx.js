/**
 * exportXlsx.js — Exportación de registros INGAMA a Excel (.xlsx)
 *
 * Utiliza exceljs para cargar las plantillas, rellenar los datos y aplicar
 * colores a celdas específicas (como resultados y frecuencias) preservando el 
 * diseño original del documento.
 */

import ExcelJS from "exceljs/dist/exceljs.min.js";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
}

function normCumple(val) {
  if (val === true) return "√";
  if (val === false || val === undefined || val === null) return "";
  return val;
}

// Colores base para resultados
const COLOR_SUCCESS = "FF059669"; // Verde
const COLOR_DANGER = "FFDC2626";  // Rojo
const COLOR_WARNING = "FFF59E0B"; // Naranja

// Mapa de colores para frecuencias
const FREQ_COLORS = {
  "D": "FF3B82F6",    // Azul
  "S": "FF8B5CF6",    // Morado
  "Q": "FFF59E0B",    // Naranja
  "M": "FF10B981",    // Verde
  "LM": "FF6366F1",   // Índigo
  "CP": "FFEC4899",   // Rosa
  "CR": "FF14B8A6",   // Teal
  "LIR": "FFF97316",  // Naranja Oscuro
};

/**
 * Escribe un valor en una celda preservando estilos, y aplica colores si se especifican.
 */
function setCell(ws, addr, value, colorArgb = null, isBold = false) {
  if (value === null || value === undefined) return;
  const cell = ws.getCell(addr);
  cell.value = value;
  
  if (colorArgb || isBold) {
    const existingFont = cell.font || {};
    const newFont = { ...existingFont };
    if (colorArgb) newFont.color = { argb: colorArgb };
    if (isBold) newFont.bold = true;
    cell.font = newFont;
  }
}

/**
 * Descarga el workbook generado en exceljs.
 */
async function downloadWorkbook(workbook, filename) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * Carga una plantilla usando exceljs.
 */
async function loadTemplate(name) {
  const res = await fetch(`/templates/${name}.xlsx`);
  if (!res.ok) throw new Error(`No se pudo cargar la plantilla ${name}.xlsx`);
  const buffer = await res.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
}

// ─── RC.LD.01 ──────────────────────────────────────────────────────────────────
export async function exportRC_LD01(record, items) {
  const wb = await loadTemplate("RC.LD.01");
  const ws = wb.worksheets[0];

  // ── Cabecera ─────────────────────────────────────────────────────
  setCell(ws, "B6", `Responsable de Control: ${record.respControl || ""}                    Fecha: ${fmtDate(record.fecha)}`);
  setCell(ws, "AN6", `Mes: ${record.mes || ""}`);
  setCell(ws, "AW6", `ÁREA: ${record.area || ""}`);
  setCell(ws, "B7", `Responsable de Seguimiento: ${record.respSeg || ""}`);

  if (record.firmaSeg?.firmado) {
    setCell(ws, "AE7", `Firmado: ${record.firmaSeg.nombre} (${record.firmaSeg.tipo === "canvas" ? "Manuscrita" : "Digital"}) ${fmtDateTime(record.firmaSeg.fechaHora)}`);
  }

  // Columnas horizontales para ítems
  const itemCols = ["C","E","G","I","K","M","O","Q","S","U","W","Y","AA","AC","AE","AG","AI","AK","AM","AO","AQ","AS","AU"];
  const itemColsPar = ["D","F","H","J","L","N","P","R","T","V","X","Z","AB","AD","AF","AH","AJ","AL","AN","AP","AR","AT","AV"];

  const MAX_ITEMS = itemCols.length;
  const dataRow = 14; 

  items.slice(0, MAX_ITEMS).forEach((itemName, idx) => {
    const col = itemCols[idx];
    const colPar = itemColsPar[idx];
    const val = record.items?.[itemName] || {};
    const freq = val.freq || "D";
    const momento = val.momento || "F";
    const cumple = normCumple(val.cumple);

    // Fila 10: nombre ítem
    setCell(ws, col + "10", itemName);
    // Fila 11: número
    setCell(ws, col + "11", String(idx + 1));
    // Fila 12: frecuencia (con color)
    setCell(ws, col + "12", freq, FREQ_COLORS[freq] || null, true);
    // Fila 13: momento — col impar=I/-, col par=F
    setCell(ws, col + "13", momento === "I" ? "I" : "-");
    setCell(ws, colPar + "13", "F");

    // Fila 14 (datos): calificación (con color)
    const colorCalif = cumple === "√" ? COLOR_SUCCESS : cumple === "x" ? COLOR_DANGER : null;
    setCell(ws, col + String(dataRow), cumple, colorCalif, true);

    if (val.accion) setCell(ws, colPar + String(dataRow), val.accion);
  });

  if (items.length > MAX_ITEMS) {
    const extras = items.slice(MAX_ITEMS);
    setCell(ws, "B31", `Ítems adicionales del área (${extras.length} más):`);
    extras.forEach((itemName, idx) => {
      const val = record.items?.[itemName] || {};
      const cumple = normCumple(val.cumple);
      const colorCalif = cumple === "√" ? COLOR_SUCCESS : cumple === "x" ? COLOR_DANGER : null;
      setCell(ws, "B" + (32 + idx), `${MAX_ITEMS + idx + 1}. ${itemName}`);
      setCell(ws, "AW" + (32 + idx), cumple, colorCalif, true);
      if (val.accion) setCell(ws, "AY" + (32 + idx), val.accion);
    });
  }

  // ── Resultado general ─────────────────────────────────────────────
  const resLetra = record.resultado === "conforme" ? "√" : record.resultado === "no_conforme" ? "X" : "";
  const colorRes = record.resultado === "conforme" ? COLOR_SUCCESS : record.resultado === "no_conforme" ? COLOR_DANGER : null;
  
  setCell(ws, "AW" + dataRow, resLetra, colorRes, true);

  if (record.correccion) setCell(ws, "AY" + dataRow, record.correccion);
  if (record.firmaCtrl?.firmado) setCell(ws, "AZ" + dataRow, `${record.firmaCtrl.nombre} ${fmtDateTime(record.firmaCtrl.fechaHora)}`);
  if (record.obs) setCell(ws, "BA" + dataRow, record.obs);
  if (record.accionCorrectivaSeg) setCell(ws, "AY" + (dataRow + 1), `Seg.: ${record.accionCorrectivaSeg}`);

  const areaSlug = (record.area || "area").replace(/[^\w\s]/g, "").replace(/\s+/g, "_").slice(0, 20);
  await downloadWorkbook(wb, `RC.LD.01_${areaSlug}_${record.fecha || "2026"}.xlsx`);
}

// ─── RC.LD.02 ──────────────────────────────────────────────────────────────────
export async function exportRC_LD02(personnel, user) {
  const wb = await loadTemplate("RC.LD.02");
  const ws = wb.worksheets[0];

  setCell(ws, "A6", `Responsable de Control: ${user?.name || ""}`);
  const today = fmtDate(new Date().toISOString().split("T")[0]);
  setCell(ws, "L6", `Fecha: ${today}`);

  const startRow = 10;
  personnel.forEach((p, idx) => {
    const row = startRow + idx;
    const msdsColor = p.msds ? COLOR_SUCCESS : COLOR_DANGER;
    const eppColor = p.epp ? COLOR_SUCCESS : COLOR_DANGER;
    const mezclaColor = p.noMezcla ? COLOR_SUCCESS : COLOR_DANGER;

    setCell(ws, `A${row}`, idx + 1);
    setCell(ws, `B${row}`, p.nombre || "");
    setCell(ws, `C${row}`, p.cargo || "");
    setCell(ws, `D${row}`, ""); // Firma física — vacío
    setCell(ws, `E${row}`, p.telefono || "");
    setCell(ws, `F${row}`, fmtDate(p.fechaAut));
    setCell(ws, `G${row}`, p.capacitacion || "");
    setCell(ws, `H${row}`, p.msds ? "√" : "✗", msdsColor, true);
    setCell(ws, `I${row}`, p.epp ? "√" : "✗", eppColor, true);
    setCell(ws, `J${row}`, p.noMezcla ? "√" : "✗", mezclaColor, true);
    setCell(ws, `K${row}`, fmtDate(p.vigencia));
    setCell(ws, `L${row}`, p.autorizadoPor || "");

    let estadoLabel = "Pendiente";
    let estadoColor = null;
    if (p.estado === "autorizado") { estadoLabel = "Autorizado"; estadoColor = COLOR_SUCCESS; }
    else if (p.estado === "suspendido") { estadoLabel = "Suspendido"; estadoColor = COLOR_DANGER; }

    setCell(ws, `M${row}`, estadoLabel, estadoColor, true);
    setCell(ws, `N${row}`, p.observaciones || "");
  });

  await downloadWorkbook(wb, `RC.LD.02_Personal_Autorizado_${today.replace(/\//g, "-")}.xlsx`);
}

// ─── RC.LD.03 ──────────────────────────────────────────────────────────────────
export async function exportRC_LD03(supplies, user) {
  const wb = await loadTemplate("RC.LD.03");
  const ws = wb.worksheets[0];

  setCell(ws, "A5", `Responsable de Control: ${user?.name || ""}`);

  const startRow = 9;
  supplies.forEach((s, idx) => {
    const row = startRow + idx;
    setCell(ws, `A${row}`, s.codigo || "");
    setCell(ws, `B${row}`, s.nombre || "");
    setCell(ws, `C${row}`, s.descripcion || "");
    setCell(ws, `D${row}`, s.unidad || "");
    setCell(ws, `E${row}`, s.proveedor || "");
    setCell(ws, `F${row}`, s.ubicacion || "");
    setCell(ws, `G${row}`, s.usoAutorizado || "");
    setCell(ws, `H${row}`, s.ingrediente || "");
    setCell(ws, `I${row}`, s.concentracion || "");
    
    const apto = s.aptoAlimentaria || s.apta;
    setCell(ws, `J${row}`, apto ? "Sí" : "No", apto ? COLOR_SUCCESS : COLOR_DANGER, true);
    
    setCell(ws, `K${row}`, s.superficieAutorizada || s.superficie || "");
    setCell(ws, `L${row}`, s.ft ? "Obligatoria" : "Pendiente");
    setCell(ws, `M${row}`, s.msds ? "Obligatoria" : "Pendiente");
    setCell(ws, `N${row}`, s.lote || "");
    setCell(ws, `O${row}`, fmtDate(s.venc));
    
    const est = s.estadoTecnico || s.estado || "";
    let estLabel = "";
    let estColor = null;
    if (est === "aprobado") { estLabel = "Aprobado para uso"; estColor = COLOR_SUCCESS; }
    else if (est === "condicionado") { estLabel = "Aprobado cond."; estColor = COLOR_WARNING; }
    else if (est === "no_contacto") { estLabel = "Solo no contacto"; estColor = COLOR_WARNING; }
    else if (est === "rechazado") { estLabel = "Rechazado"; estColor = COLOR_DANGER; }

    setCell(ws, `P${row}`, estLabel, estColor, true);
    setCell(ws, `Q${row}`, s.registroRecepcion || "");
    setCell(ws, `R${row}`, s.observaciones || "");
  });

  const today = fmtDate(new Date().toISOString().split("T")[0]);
  await downloadWorkbook(wb, `RC.LD.03_Insumos_${today.replace(/\//g, "-")}.xlsx`);
}

// ─── RC.MA.09 ─────────────────────────────────────────────────────────────────
export async function exportRC_MA09(records, user) {
  const wb = await loadTemplate("RC.MA.9");
  const ws = wb.worksheets[0];

  setCell(ws, "A5", `Responsable del Control: ${user?.name || ""}`);

  const clasificar = (valor) => {
    const n = parseFloat(valor);
    if (isNaN(n)) return null;
    if (n <= 100) return "pasa";
    if (n <= 500) return "precaucion";
    return "no_pasa";
  };

  const startRow = 10;
  records.forEach((r, idx) => {
    const row = startRow + idx;
    if (row > 25) return; 
    const clasif = clasificar(r.resultado);
    const rlu = parseFloat(r.resultado);

    setCell(ws, `A${row}`, fmtDate(r.fecha));
    setCell(ws, `B${row}`, r.tipo === "superficie" ? "√" : "", r.tipo === "superficie" ? COLOR_SUCCESS : null, true);
    setCell(ws, `C${row}`, r.tipo === "manos" ? "√" : "", r.tipo === "manos" ? COLOR_SUCCESS : null, true);
    setCell(ws, `D${row}`, r.area || "");
    setCell(ws, `E${row}`, r.identificacion || r.punto || "");
    
    // Resultados con colores
    setCell(ws, `F${row}`, clasif === "pasa" ? rlu : "", COLOR_SUCCESS, true);
    setCell(ws, `G${row}`, clasif === "precaucion" ? rlu : "", COLOR_WARNING, true);
    setCell(ws, `H${row}`, clasif === "no_pasa" ? rlu : "", COLOR_DANGER, true);
    
    setCell(ws, `L${row}`, r.correccion || r.accion || "");
  });

  const today = fmtDate(new Date().toISOString().split("T")[0]);
  await downloadWorkbook(wb, `RC.MA.09_Hisopado_ATP_${today.replace(/\//g, "-")}.xlsx`);
}
