/**
 * exportXlsx.js — Exportación de registros INGAMA a Excel (.xlsx)
 *
 * Usa ExcelJS (no SheetJS) porque:
 *  - ExcelJS PRESERVA estilos al escribir (colores, bordes, fuentes, fusiones)
 *  - SheetJS solo lee estilos, no los escribe en la versión community
 *
 * Estrategia: cargar la plantilla oficial desde /public/templates/,
 * rellenar ÚNICAMENTE los campos de datos en las celdas exactas,
 * y descargar el archivo preservando 100% el formato visual original.
 */

import ExcelJS from "exceljs";

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

/**
 * Escribe un valor en una celda preservando estilo y fusiones.
 * ExcelJS gestiona automáticamente el estilo cuando se asigna .value
 * sin tocar .style, .font, .border, .fill, .alignment, etc.
 */
function setCell(ws, addr, value) {
  if (value === null || value === undefined) return;
  const cell = ws.getCell(addr);
  cell.value = value;
}

/**
 * Carga una plantilla desde /public/templates/ preservando todos los estilos.
 */
async function loadTemplate(name) {
  const res = await fetch(`/templates/${name}.xlsx`);
  if (!res.ok) throw new Error(`No se pudo cargar la plantilla ${name}.xlsx`);
  const buf = await res.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  return wb;
}

/**
 * Descarga el workbook como .xlsx preservando estilos.
 */
async function downloadWorkbook(wb, filename) {
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
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
    setCell(ws, "AE7", `Firma: ${record.firmaSeg.nombre || ""}`);
  }

  // ── Ítems (columnas horizontales) ─────────────────────────────────
  const itemCols = [
    "C","E","G","I","K","M","O","Q","S","U","W","Y",
    "AA","AC","AE","AG","AI","AK","AM","AO","AQ","AS","AU"
  ];
  const itemColsPar = [
    "D","F","H","J","L","N","P","R","T","V","X","Z",
    "AB","AD","AF","AH","AJ","AL","AN","AP","AR","AT","AV"
  ];

  const MAX_ITEMS = itemCols.length;
  const dataRow = 14;

  items.slice(0, MAX_ITEMS).forEach((itemName, idx) => {
    const col = itemCols[idx];
    const colPar = itemColsPar[idx];
    const val = record.items?.[itemName] || {};
    const freq = val.freq || "D";
    const momento = val.momento || "F";
    const cumple = normCumple(val.cumple);

    setCell(ws, col + "10", itemName);
    setCell(ws, col + "11", String(idx + 1));
    setCell(ws, col + "12", freq);
    setCell(ws, col + "13", momento === "I" ? "I" : "-");
    setCell(ws, colPar + "13", "F");
    setCell(ws, col + String(dataRow), cumple);
    if (val.accion) setCell(ws, colPar + String(dataRow), val.accion);
  });

  // ── Resultado general ─────────────────────────────────────────────
  const resLetra = record.resultado === "conforme" ? "√"
    : record.resultado === "no_conforme" ? "X" : "";
  setCell(ws, "AW" + dataRow, resLetra);

  if (record.correccion) setCell(ws, "AY" + dataRow, record.correccion);
  if (record.firmaCtrl?.firmado) {
    setCell(ws, "AZ" + dataRow, `${record.firmaCtrl.nombre} ${fmtDateTime(record.firmaCtrl.fechaHora)}`);
  }
  if (record.obs) setCell(ws, "BA" + dataRow, record.obs);
  if (record.accionCorrectivaSeg) {
    setCell(ws, "AY" + (dataRow + 1), `Seg.: ${record.accionCorrectivaSeg}`);
  }

  const areaSlug = (record.area || "area").replace(/[^\w\s]/g, "").replace(/\s+/g, "_").slice(0, 20);
  await downloadWorkbook(wb, `RC.LD.01_${areaSlug}_${record.fecha || "2026"}.xlsx`);
}

// ─── RC.LD.02 ──────────────────────────────────────────────────────────────────

export async function exportRC_LD02(personnel, user) {
  const wb = await loadTemplate("RC.LD.02");
  const ws = wb.worksheets[0];

  setCell(ws, "A6", `Responsable de Control: ${user?.name || ""}`);
  setCell(ws, "A7", `Responsable de Seguimiento: ${user?.name || ""}`);

  const startRow = 10;
  personnel.forEach((p, idx) => {
    const row = startRow + idx;
    setCell(ws, `A${row}`, idx + 1);
    setCell(ws, `B${row}`, p.nombre || "");
    setCell(ws, `C${row}`, p.cargo || "");
    setCell(ws, `D${row}`, "");
    setCell(ws, `E${row}`, p.telefono || "");
    setCell(ws, `F${row}`, fmtDate(p.fechaAut));
    setCell(ws, `G${row}`, p.capacitacion || "");
    setCell(ws, `H${row}`, p.msds ? "√" : "✗");
    setCell(ws, `I${row}`, p.epp ? "√" : "✗");
    setCell(ws, `J${row}`, p.noMezcla ? "√" : "✗");
    setCell(ws, `K${row}`, fmtDate(p.vigencia));
    setCell(ws, `L${row}`, p.autorizadoPor || "");
    const estadoLabel = p.estado === "autorizado" ? "Autorizado"
      : p.estado === "pendiente" ? "Pendiente" : "Suspendido";
    setCell(ws, `M${row}`, estadoLabel);
    setCell(ws, `N${row}`, p.observaciones || "");
  });

  const today = fmtDate(new Date().toISOString().split("T")[0]);
  await downloadWorkbook(wb, `RC.LD.02_Personal_Autorizado_${today.replace(/\//g, "-")}.xlsx`);
}

// ─── RC.LD.03 ──────────────────────────────────────────────────────────────────

export async function exportRC_LD03(supplies, user) {
  const wb = await loadTemplate("RC.LD.03");
  const ws = wb.worksheets[0];

  setCell(ws, "A5", `Responsable de Control: ${user?.name || ""}`);
  setCell(ws, "A6", `Responsable de Seguimiento: ${user?.name || ""}`);

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
    setCell(ws, `J${row}`, (s.aptoAlimentaria || s.apta) ? "Sí" : "No");
    setCell(ws, `K${row}`, s.superficieAutorizada || s.superficie || "");
    setCell(ws, `L${row}`, s.ft ? "Obligatoria" : "Pendiente");
    setCell(ws, `M${row}`, s.msds ? "Obligatoria" : "Pendiente");
    setCell(ws, `N${row}`, s.lote || "");
    setCell(ws, `O${row}`, fmtDate(s.venc));
    const est = s.estadoTecnico || s.estado || "";
    setCell(ws, `P${row}`,
      est === "aprobado" ? "Aprobado para uso definido"
      : est === "condicionado" ? "Aprobado condicionado"
      : est === "no_contacto" ? "Solo no contacto directo"
      : est === "rechazado" ? "Rechazado"
      : ""
    );
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
  setCell(ws, "A6", `Responsable de Seguimiento: ${user?.name || ""}`);

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
    setCell(ws, `B${row}`, r.tipo === "superficie" ? "√" : "");
    setCell(ws, `C${row}`, r.tipo === "manos" ? "√" : "");
    setCell(ws, `D${row}`, r.area || "");
    setCell(ws, `E${row}`, r.identificacion || r.punto || "");
    setCell(ws, `F${row}`, clasif === "pasa" ? rlu : "");
    setCell(ws, `G${row}`, clasif === "precaucion" ? rlu : "");
    setCell(ws, `H${row}`, clasif === "no_pasa" ? rlu : "");
    setCell(ws, `L${row}`, r.correccion || r.accion || "");
  });

  const today = fmtDate(new Date().toISOString().split("T")[0]);
  await downloadWorkbook(wb, `RC.MA.09_Hisopado_ATP_${today.replace(/\//g, "-")}.xlsx`);
}
