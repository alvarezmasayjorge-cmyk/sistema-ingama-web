/**
 * exportXlsx.js — Exportación de registros INGAMA a Excel (.xlsx)
 *
 * Estrategia: Carga la plantilla oficial desde /public/templates/,
 * rellena ÚNICAMENTE los campos de datos en las celdas exactas del formato,
 * y descarga el archivo preservando 100% el formato visual original
 * (colores, bordes, fusiones, fuentes, etc.).
 *
 * CLAVE: Se usa cellStyles: true en READ y WRITE para preservar estilos.
 */

import * as XLSX from "xlsx";

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
 * Escribe un valor en una celda PRESERVANDO su estilo (.s).
 * Si la celda ya existe, solo actualiza el valor. Si no existe, la crea vacía.
 */
function setCell(ws, addr, value) {
  if (value === null || value === undefined) return;
  const strVal = String(value);
  if (ws[addr]) {
    // Preservar estilo original — solo cambiar el valor
    ws[addr].v = value;
    ws[addr].w = strVal;
    ws[addr].t = typeof value === "number" ? "n" : "s";
    // Limpiar cache de formato enriquecido para que tome el nuevo valor
    delete ws[addr].r;
    delete ws[addr].h;
  } else {
    // Celda nueva (no tenía estilo en la plantilla — celdas de datos vacíos)
    ws[addr] = { t: typeof value === "number" ? "n" : "s", v: value, w: strVal };
  }
}

/**
 * Descarga el workbook como .xlsx preservando todos los estilos.
 * CRÍTICO: bookType: 'xlsx' + cellStyles: true
 */
function downloadWorkbook(wb, filename) {
  const wbout = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
    cellStyles: true,   // ← preserva colores, bordes, fuentes
    bookSST: false,
  });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
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
 * Carga una plantilla desde /public/templates/ con estilos completos.
 */
async function loadTemplate(name) {
  const res = await fetch(`/templates/${name}.xlsx`);
  if (!res.ok) throw new Error(`No se pudo cargar la plantilla ${name}.xlsx`);
  const buf = await res.arrayBuffer();
  return XLSX.read(buf, {
    type: "array",
    cellStyles: true,   // ← lee colores, bordes, fuentes
    cellNF: true,       // ← lee formatos numéricos
    cellDates: false,
  });
}

// ─── RC.LD.01 ──────────────────────────────────────────────────────────────────
/**
 * Estructura plantilla RC.LD.01 (hoja: "RC.LD.01", rango: B1:BF37):
 *
 * CABECERA:
 * - B2: "BENEFICIADORA ", G2: "REGISTRO", AW2: "RC.LD.01"
 * - G3: "LIMPIEZA Y DESINFECCION", AW3: "No. Revisión: 03"
 * - AW4: "Vigente A Partir de 01-06-2026"
 * - B6: "Responsable de Control: ___"   → rellenar nombre + fecha
 * - AN6: "Mes:___"                       → rellenar mes
 * - AW6: "ÁREA: "                        → rellenar área
 * - B7: "Responsable de Seguimiento: __" → rellenar nombre
 * - AE7: "Firma: ____"                   → rellenar firma si existe
 *
 * ÍTEMS (horizontal, 2 columnas por ítem):
 * - Fila 10: nombre del ítem (C10, E10, G10... = cols C,E,G,I,K,M,O,Q,S,U,W,Y,AA,AC,AE,AG,AI,AK,AM,AO,AQ,AS,AU)
 * - Fila 11: número correlativo (B11=N°, C11=1, E11=2...)
 * - Fila 12: frecuencia (B12="Frecuencia", C12=D, E12=D...)
 * - Fila 13: momento I/F (C13=I, D13=F, E13=I/-, F13=F...)
 *
 * DATOS CALIFICACIÓN (filas 14–30, mismas columnas que ítems):
 * - Col de cada ítem en fila 14: calificación (√ o x o vacío)
 *
 * RESULTADO GENERAL (filas 14–30):
 * - AW: √/X según resultado general
 * - AY: acción correctiva
 * - AZ: firma del control (texto)
 * - BA: observaciones
 *
 * LEYENDA (filas 31–35): no tocar
 */
export async function exportRC_LD01(record, items) {
  const wb = await loadTemplate("RC.LD.01");
  const ws = wb.Sheets[wb.SheetNames[0]];

  // ── Cabecera ─────────────────────────────────────────────────────
  setCell(ws, "B6",
    `Responsable de Control: ${record.respControl || ""}                    Fecha: ${fmtDate(record.fecha)}`
  );
  setCell(ws, "AN6", `Mes: ${record.mes || ""}`);
  setCell(ws, "AW6", `ÁREA: ${record.area || ""}`);
  setCell(ws, "B7", `Responsable de Seguimiento: ${record.respSeg || ""}`);

  if (record.firmaSeg?.firmado) {
    setCell(ws, "AE7",
      `Firmado: ${record.firmaSeg.nombre} (${record.firmaSeg.tipo === "canvas" ? "Manuscrita" : "Digital"}) ${fmtDateTime(record.firmaSeg.fechaHora)}`
    );
  }

  // ── Ítems (columnas horizontales, fila 10 = nombre, 11 = N°, 12 = freq, 13 = momento) ──
  // Columna del nombre de cada ítem (una por cada 2 cols: C, E, G, I... hasta AU = col 46)
  const itemCols = [
    "C","E","G","I","K","M","O","Q","S","U","W","Y",
    "AA","AC","AE","AG","AI","AK","AM","AO","AQ","AS","AU"
  ];
  // Columna "par" de cada ítem (D, F, H, J... para el momento F)
  const itemColsPar = [
    "D","F","H","J","L","N","P","R","T","V","X","Z",
    "AB","AD","AF","AH","AJ","AL","AN","AP","AR","AT","AV"
  ];

  const MAX_ITEMS = itemCols.length; // 23
  const dataRow = 14; // Primera fila de datos del registro

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
    // Fila 12: frecuencia
    setCell(ws, col + "12", freq);
    // Fila 13: momento — col impar=I/-, col par=F
    setCell(ws, col + "13", momento === "I" ? "I" : "-");
    setCell(ws, colPar + "13", "F");

    // Fila 14 (datos): calificación
    setCell(ws, col + String(dataRow), cumple);

    // Acción correctiva del ítem (si existe, en colPar)
    if (val.accion) {
      setCell(ws, colPar + String(dataRow), val.accion);
    }
  });

  // Si hay más de 23 ítems, los listamos en filas adicionales debajo de la leyenda
  if (items.length > MAX_ITEMS) {
    const extras = items.slice(MAX_ITEMS);
    setCell(ws, "B31", `Ítems adicionales del área (${extras.length} más):`);
    extras.forEach((itemName, idx) => {
      const val = record.items?.[itemName] || {};
      const cumple = normCumple(val.cumple);
      setCell(ws, "B" + (32 + idx), `${MAX_ITEMS + idx + 1}. ${itemName}`);
      setCell(ws, "AW" + (32 + idx), cumple);
      if (val.accion) setCell(ws, "AY" + (32 + idx), val.accion);
    });
  }

  // ── Resultado general ─────────────────────────────────────────────
  const resLetra = record.resultado === "conforme" ? "√"
    : record.resultado === "no_conforme" ? "X" : "";
  setCell(ws, "AW" + dataRow, resLetra);

  if (record.correccion) {
    setCell(ws, "AY" + dataRow, record.correccion);
  }
  if (record.firmaCtrl?.firmado) {
    setCell(ws, "AZ" + dataRow,
      `${record.firmaCtrl.nombre} ${fmtDateTime(record.firmaCtrl.fechaHora)}`
    );
  }
  if (record.obs) {
    setCell(ws, "BA" + dataRow, record.obs);
  }

  // Acción correctiva del seguimiento
  if (record.accionCorrectivaSeg) {
    setCell(ws, "AY" + (dataRow + 1), `Seg.: ${record.accionCorrectivaSeg}`);
  }

  const areaSlug = (record.area || "area").replace(/[^\w\s]/g, "").replace(/\s+/g, "_").slice(0, 20);
  downloadWorkbook(wb, `RC.LD.01_${areaSlug}_${record.fecha || "2026"}.xlsx`);
}

// ─── RC.LD.02 ──────────────────────────────────────────────────────────────────
/**
 * Estructura plantilla RC.LD.02 (hoja: "RC.01Personal_Autoriz_Depósito", rango: A1:W1001):
 *
 * CABECERA:
 * - D2: "REGISTRO", M2: "RC.LD.02"
 * - D3: "PERSONAL AUTORIZADO PARA INGRESAR AL DEPÓSITO...", M3: "No. Revisión: 02"
 * - M4: "Vigente A Partir de 09-05-26"
 * - A6: "Responsable de Control: ___"  → rellenar
 * - L6: "Firma: ___"                   → rellenar
 * - A7: "Responsable de Seguimiento: __" → rellenar
 * - L7: "Firma: ___"                   → rellenar
 *
 * TABLA (headers en fila 9, datos desde fila 10):
 * A=N°, B=NOMBRE DEL MIEMBRO, C=CARGO, D=FIRMA, E=NÚMERO TELÉFONO CELULAR,
 * F=FECHA DE AUTORIZACIÓN, G=CAPACITACIÓN RECIBIDA, H=MSDS/FICHAS TÉCNICAS,
 * I=EPP Y DILUCIONES EVALUADO, J=NO MEZCLA DE QUÍMICOS, K=VIGENCIA/PRÓXIMA REVISIÓN,
 * L=RESPONSABLE QUE AUTORIZA, M=ESTADO DE AUTORIZACIÓN, N=OBSERVACIONES
 *
 * Datos: A10=1, A11=2... (ya tienen los números en la plantilla)
 * Solo rellenamos B-N de cada fila
 */
export async function exportRC_LD02(personnel, user) {
  const wb = await loadTemplate("RC.LD.02");
  const ws = wb.Sheets[wb.SheetNames[0]];

  // Cabecera
  setCell(ws, "A6", `Responsable de Control: ${user?.name || ""}`);
  const today = fmtDate(new Date().toISOString().split("T")[0]);
  setCell(ws, "L6", `Fecha: ${today}`);

  // Datos del personal (inicio en fila 10)
  const startRow = 10;
  personnel.forEach((p, idx) => {
    const row = startRow + idx;
    // El número ya está en la plantilla (A10=1, A11=2...), pero lo ponemos por si acaso
    setCell(ws, `A${row}`, idx + 1);
    setCell(ws, `B${row}`, p.nombre || "");
    setCell(ws, `C${row}`, p.cargo || "");
    setCell(ws, `D${row}`, ""); // Firma física — vacío
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

  downloadWorkbook(wb, `RC.LD.02_Personal_Autorizado_${today.replace(/\//g, "-")}.xlsx`);
}

// ─── RC.LD.03 ──────────────────────────────────────────────────────────────────
/**
 * Estructura plantilla RC.LD.03 (hoja: "LD", rango: A1:R25):
 *
 * CABECERA:
 * - A1: "BENEFICIADORA", C1: "REGISTRO"
 * - A5: "Responsable de Control: ___"  → rellenar
 * - A6: "Responsable de Seguimiento: __" → rellenar
 *
 * TABLA (headers en fila 8, datos desde fila 9):
 * A=Código del Insumo, B=Nombre del Insumo, C=Descripción/Presentación,
 * D=Unidad de Medida, E=Proveedor, F=Ubicación, G=Uso autorizado en planta,
 * H=Ingrediente activo/componente principal, I=Concentración comercial,
 * J=Apto industria alimentaria/superficies contacto,
 * K=Superficie/aplicación autorizada, L=Ficha técnica, M=MSDS,
 * (N=Lote, O=Venc, P=Estado, Q=Registro, R=Obs — según el sistema)
 *
 * La plantilla ya tiene datos de ejemplo en fila 9 — los reemplazamos.
 */
export async function exportRC_LD03(supplies, user) {
  const wb = await loadTemplate("RC.LD.03");
  const ws = wb.Sheets[wb.SheetNames[0]];

  // Cabecera
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
    setCell(ws, `J${row}`, (s.aptoAlimentaria || s.apta) ? "Sí" : "No");
    setCell(ws, `K${row}`, s.superficieAutorizada || s.superficie || "");
    setCell(ws, `L${row}`, s.ft ? "Obligatoria" : "Pendiente");
    setCell(ws, `M${row}`, s.msds ? "Obligatoria" : "Pendiente");
    // Si el formato tiene más columnas para lote, venc, estado, obs:
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
  downloadWorkbook(wb, `RC.LD.03_Insumos_${today.replace(/\//g, "-")}.xlsx`);
}

// ─── RC.MA.09 ─────────────────────────────────────────────────────────────────
/**
 * Estructura plantilla RC.MA.9 (hoja: "Hoja1", rango: A1:L25):
 *
 * CABECERA:
 * - D1: "REGISTRO", K1: "RC.MA.09"
 * - D2: "CONTROL DE HISOPADO DE MANOS Y SUPERFICIE ATP", K2: "No. Revisión: 01"
 * - K3: "Vigente A Partir de 04-01-25"
 * - A5: "Responsable del Control:____"  → rellenar
 * - J5: "Firma"                         → rellenar si existe
 * - A6: "Responsable de Seguimiento:__" → rellenar
 * - J6: "Firma"                         → rellenar si existe
 *
 * TABLA (headers en filas 8-9, datos desde fila 10):
 * - A8: Fecha | B8: Tipo | D8: Área o Sector | E8: Identificación Superficie
 * - F8: Resultado | I8: Unidad | J8: Límite | L8: Corrección
 * - B9: Superficie | C9: Manos | F9: Pasa | G9: Precaución | H9: No Pasa
 * - J9: Min | K9: Max
 *
 * Datos por fila (10-25, máximo 16 registros):
 * - A: fecha
 * - B: "√" si tipo=superficie (columna Superficie)
 * - C: "√" si tipo=manos (columna Manos)
 * - D: área o sector
 * - E: identificación superficie / persona
 * - F: resultado RLU si clasif=pasa (≤100)
 * - G: resultado RLU si clasif=precaución (101-500)
 * - H: resultado RLU si clasif=no_pasa (>500)
 * - I: "RLU" (ya está en plantilla)
 * - J: 100 (límite min — ya está)
 * - K: 500 (límite max — ya está)
 * - L: corrección/acción
 */
export async function exportRC_MA09(records, user) {
  const wb = await loadTemplate("RC.MA.9");
  const ws = wb.Sheets[wb.SheetNames[0]];

  // Cabecera
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
    if (row > 25) return; // Máximo 16 filas de datos en el formato
    const clasif = clasificar(r.resultado);
    const rlu = parseFloat(r.resultado);

    setCell(ws, `A${row}`, fmtDate(r.fecha));
    // Tipo: √ en columna B (Superficie) o C (Manos)
    setCell(ws, `B${row}`, r.tipo === "superficie" ? "√" : "");
    setCell(ws, `C${row}`, r.tipo === "manos" ? "√" : "");
    setCell(ws, `D${row}`, r.area || "");
    setCell(ws, `E${row}`, r.identificacion || r.punto || "");
    // Resultado en la columna de clasificación correcta
    setCell(ws, `F${row}`, clasif === "pasa" ? rlu : "");
    setCell(ws, `G${row}`, clasif === "precaucion" ? rlu : "");
    setCell(ws, `H${row}`, clasif === "no_pasa" ? rlu : "");
    // I=RLU, J=100, K=500 ya están en la plantilla — no los sobrescribimos
    setCell(ws, `L${row}`, r.correccion || r.accion || "");
  });

  const today = fmtDate(new Date().toISOString().split("T")[0]);
  downloadWorkbook(wb, `RC.MA.09_Hisopado_ATP_${today.replace(/\//g, "-")}.xlsx`);
}
