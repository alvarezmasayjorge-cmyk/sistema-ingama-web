// Motor de Análisis Predictivo — JavaScript puro, sin dependencias externas

const today = () => new Date();

export function calculateAreaRisks(records, rcma9) {
  const byArea = {};
  records.forEach((r) => {
    if (!byArea[r.area]) byArea[r.area] = [];
    byArea[r.area].push(r);
  });

  return Object.entries(byArea)
    .map(([area, areaRecords]) => {
      const total = areaRecords.length;
      const noConformes = areaRecords.filter((r) => r.resultado === "no_conforme").length;
      const rechazados = areaRecords.filter((r) => r.estado === "rechazado").length;
      const borradores = areaRecords.filter((r) => r.estado === "borrador").length;

      const sorted = [...areaRecords].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
      const lastFecha = sorted[0]?.fecha;
      const daysSinceLast = lastFecha
        ? Math.floor((today() - new Date(lastFecha)) / 86400000)
        : 999;

      const atpRecords = (rcma9 || []).filter((r) => r.area === area);
      const atpNoConf = atpRecords.filter((r) => r.estado === "no_conforme").length;
      const atpRisk = atpRecords.length > 0 ? atpNoConf / atpRecords.length : 0;

      const noConformeRatio = noConformes / total;
      const rejectedRatio = rechazados / total;
      const timeRisk = Math.min(daysSinceLast / 45, 1);

      const score = Math.min(
        100,
        Math.round((noConformeRatio * 0.40 + rejectedRatio * 0.30 + timeRisk * 0.15 + atpRisk * 0.15) * 100)
      );

      let trend = "→";
      if (total >= 4) {
        const chronological = [...areaRecords].sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
        const half = Math.floor(total / 2);
        const firstConf = chronological.slice(0, half).filter((r) => r.resultado === "conforme").length / half;
        const lastConf = chronological.slice(half).filter((r) => r.resultado === "conforme").length / (total - half);
        if (lastConf > firstConf + 0.1) trend = "↗";
        else if (lastConf < firstConf - 0.1) trend = "↘";
      }

      let level, levelLabel, levelColor;
      if (score >= 65) { level = "critico"; levelLabel = "Crítico"; levelColor = "#ef4444"; }
      else if (score >= 40) { level = "alto"; levelLabel = "Alto"; levelColor = "#f59e0b"; }
      else if (score >= 15) { level = "medio"; levelLabel = "Moderado"; levelColor = "#3b82f6"; }
      else { level = "bajo"; levelLabel = "Bajo"; levelColor = "#10b981"; }

      const reasons = [];
      if (noConformeRatio > 0.3) reasons.push("no conformidades frecuentes");
      if (rejectedRatio > 0.2) reasons.push("registros rechazados");
      if (daysSinceLast > 30) reasons.push(`${daysSinceLast}d sin nuevo registro`);
      if (atpRisk > 0.3) reasons.push("hisopados fuera de límite");
      if (borradores > 0) reasons.push(`${borradores} borrador(es) sin firmar`);

      return {
        area,
        score,
        level,
        levelLabel,
        levelColor,
        trend,
        reason: reasons.length > 0 ? reasons.join(" · ") : "Sin alertas detectadas",
        total,
        noConformes,
        daysSinceLast,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function generateRecommendations(records, personnel, supplies, rcma9) {
  const now = today();
  const recs = [];

  const lastByArea = {};
  records.forEach((r) => {
    if (!lastByArea[r.area] || r.fecha > lastByArea[r.area]) lastByArea[r.area] = r.fecha;
  });
  const overdueAreas = Object.entries(lastByArea).filter(([, fecha]) => {
    const days = Math.floor((now - new Date(fecha)) / 86400000);
    return days > 20;
  });
  if (overdueAreas.length > 0) {
    recs.push({
      priority: "alta",
      category: "Registros",
      text: `${overdueAreas.length} área(s) sin registro en más de 20 días`,
      action: "Crear nuevos registros de limpieza",
    });
  }

  const atpNoConf = (rcma9 || []).filter((r) => r.estado === "no_conforme");
  if (atpNoConf.length > 0) {
    const areasAfectadas = [...new Set(atpNoConf.map((r) => r.area))].length;
    recs.push({
      priority: "alta",
      category: "Hisopados ATP",
      text: `${atpNoConf.length} hisopado(s) fuera de límite en ${areasAfectadas} área(s)`,
      action: "Realizar re-limpieza y nuevo hisopado de verificación",
    });
  }

  const personnelSoon = personnel.filter((p) => {
    if (!p.vigencia) return false;
    const days = Math.floor((new Date(p.vigencia) - now) / 86400000);
    return days >= 0 && days <= 60;
  });
  if (personnelSoon.length > 0) {
    recs.push({
      priority: "media",
      category: "Personal",
      text: `${personnelSoon.length} autorización(es) vencen en menos de 60 días`,
      action: "Renovar capacitaciones: MSDS, EPP y no-mezcla",
    });
  }

  const condicionados = supplies.filter((s) => s.estado === "condicionado");
  if (condicionados.length > 0) {
    recs.push({
      priority: "media",
      category: "Insumos",
      text: `${condicionados.length} insumo(s) en estado condicionado`,
      action: "Revisar ficha técnica y MSDS de insumos condicionados",
    });
  }

  const borradores = records.filter((r) => r.estado === "borrador");
  if (borradores.length > 0) {
    recs.push({
      priority: "baja",
      category: "Pendientes",
      text: `${borradores.length} registro(s) en borrador sin firmar`,
      action: "Completar firmas de Control y Seguimiento",
    });
  }

  if (recs.length === 0) {
    recs.push({
      priority: "baja",
      category: "Sistema",
      text: "Sin alertas críticas detectadas",
      action: "Continuar con el plan de limpieza habitual",
    });
  }

  const order = { alta: 0, media: 1, baja: 2 };
  return recs.sort((a, b) => order[a.priority] - order[b.priority]);
}

// ─── NLP: Análisis de observaciones ──────────────────────────────────────────
const KEYWORD_CATEGORIES = {
  higiene: { keywords: ["sucio", "sucia", "manchas", "mancha", "derrame", "polvo", "grasa", "residuo", "residuos", "moho", "limpiar", "lavar"], color: "#f59e0b" },
  equipos: { keywords: ["roto", "rota", "dañado", "dañada", "fuga", "avería", "no funciona", "descompuesto", "deteriorado"], color: "#ef4444" },
  material: { keywords: ["falta", "agotado", "vencido", "caducado", "insuficiente", "sin", "faltante"], color: "#3b82f6" },
  estructural: { keywords: ["pared", "piso", "techo", "puerta", "ventana", "azulejo"], color: "#8b5cf6" },
  personal: { keywords: ["ausente", "sin firmar", "sin capacitar", "no firmó", "olvidó", "pendiente de firma"], color: "#06b6d4" },
};

export function analyzeObservations(records) {
  const wordCount = {};
  const categoryCount = { higiene: 0, equipos: 0, material: 0, estructural: 0, personal: 0 };

  records.forEach((r) => {
    const obs = (r.obs || "").toLowerCase();
    if (!obs || obs.length < 3) return;

    Object.entries(KEYWORD_CATEGORIES).forEach(([cat, { keywords }]) => {
      keywords.forEach((kw) => {
        if (obs.includes(kw)) {
          categoryCount[cat]++;
          wordCount[kw] = (wordCount[kw] || 0) + 1;
        }
      });
    });
  });

  const topWords = Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));

  const topCategories = Object.entries(categoryCount)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, count]) => ({
      category: cat,
      count,
      ...KEYWORD_CATEGORIES[cat],
    }));

  return { topWords, topCategories, totalObservations: records.filter((r) => r.obs && r.obs.length > 3).length };
}

// ─── Score de personal ──────────────────────────────────────────────────────
export function calculatePersonnelScores(records, personnel) {
  return personnel
    .map((p) => {
      const involved = records.filter((r) => r.respControl === p.nombre || r.respSeg === p.nombre);
      const total = involved.length;
      if (total === 0) return { ...p, score: null, total: 0, conformes: 0, rechazados: 0 };

      const conformes = involved.filter((r) => r.resultado === "conforme").length;
      const rechazados = involved.filter((r) => r.estado === "rechazado").length;
      const aprobados = involved.filter((r) => r.estado === "aprobado").length;

      const confRate = conformes / total;
      const rejRate = rechazados / total;
      const score = Math.round(Math.max(0, Math.min(100, confRate * 100 - rejRate * 30 + (aprobados / total) * 10)));

      let level, color;
      if (score >= 80) { level = "Excelente"; color = "#10b981"; }
      else if (score >= 60) { level = "Bueno"; color = "#3b82f6"; }
      else if (score >= 40) { level = "Regular"; color = "#f59e0b"; }
      else { level = "Bajo"; color = "#ef4444"; }

      return {
        nombre: p.nombre,
        cargo: p.cargo,
        score,
        total,
        conformes,
        rechazados,
        level,
        color,
      };
    })
    .filter((p) => p.score !== null)
    .sort((a, b) => b.score - a.score);
}

// ─── Detección de anomalías ─────────────────────────────────────────────────
export function detectAnomalies(records) {
  const anomalies = [];

  const byDateAndPerson = {};
  records.forEach((r) => {
    if (!r.fecha || !r.respControl) return;
    const key = `${r.fecha}|${r.respControl}`;
    byDateAndPerson[key] = (byDateAndPerson[key] || 0) + 1;
  });
  Object.entries(byDateAndPerson).forEach(([key, count]) => {
    if (count >= 4) {
      const [fecha, persona] = key.split("|");
      anomalies.push({
        severity: "media",
        title: "Múltiples firmas el mismo día",
        detail: `${persona} firmó ${count} registros el ${fecha}`,
      });
    }
  });

  const byArea = {};
  records.forEach((r) => {
    if (!byArea[r.area]) byArea[r.area] = [];
    byArea[r.area].push(r);
  });
  Object.entries(byArea).forEach(([area, recs]) => {
    if (recs.length >= 4) {
      const allConformes = recs.every((r) => r.resultado === "conforme");
      if (allConformes) {
        anomalies.push({
          severity: "baja",
          title: "Conformidad 100% sospechosa",
          detail: `${area}: ${recs.length} registros sin ninguna no conformidad`,
        });
      }
    }
  });

  records.forEach((r) => {
    if (r.resultado === "no_conforme" && (!r.obs || r.obs.length < 5)) {
      anomalies.push({
        severity: "alta",
        title: "No conformidad sin observación",
        detail: `${r.id} (${r.area}) marcado como no conforme sin detalle`,
      });
    }
  });

  records.forEach((r) => {
    if (r.estado === "aprobado" && (!r.firmaCtrl || !r.firmaSeg)) {
      anomalies.push({
        severity: "alta",
        title: "Aprobado sin firma completa",
        detail: `${r.id} aprobado sin todas las firmas requeridas`,
      });
    }
  });

  const order = { alta: 0, media: 1, baja: 2 };
  return anomalies.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 6);
}

// ─── Recomendación de frecuencia ────────────────────────────────────────────
export function recommendFrequency(records, areaRisks) {
  return areaRisks.slice(0, 5).map((risk) => {
    let suggestedDays, reason;
    if (risk.score >= 65) {
      suggestedDays = 3;
      reason = "Riesgo crítico — inspección frecuente";
    } else if (risk.score >= 40) {
      suggestedDays = 7;
      reason = "Riesgo alto — inspección semanal";
    } else if (risk.score >= 15) {
      suggestedDays = 15;
      reason = "Riesgo moderado — quincenal";
    } else {
      suggestedDays = 30;
      reason = "Riesgo bajo — mensual";
    }

    const currentGap = risk.daysSinceLast;
    const status = currentGap > suggestedDays ? "atrasado" : "al_dia";

    return {
      area: risk.area,
      suggestedDays,
      currentGap,
      reason,
      status,
      color: risk.levelColor,
    };
  });
}

// ─── Análisis de insumos ─────────────────────────────────────────────────────
export function analyzeSupplies(supplies) {
  const today = new Date();
  const total = supplies.length;
  if (total === 0) return { issues: [], healthScore: 100 };

  const aprobados = supplies.filter((s) => (s.estadoTecnico || s.estado) === "aprobado").length;
  const condicionados = supplies.filter((s) => (s.estadoTecnico || s.estado) === "condicionado").length;
  const rechazados = supplies.filter((s) => (s.estadoTecnico || s.estado) === "rechazado").length;

  const venciendo = supplies.filter((s) => {
    if (!s.venc) return false;
    const days = Math.floor((new Date(s.venc) - today) / 86400000);
    return days >= 0 && days <= 45;
  });
  const vencidos = supplies.filter((s) => s.venc && new Date(s.venc) < today);

  const sinDocs = supplies.filter((s) => !s.ft || !s.msds);

  const healthScore = Math.round(
    Math.max(0, ((aprobados / total) * 60 + (1 - vencidos.length / total) * 25 + (1 - sinDocs.length / total) * 15))
  );

  const issues = [];
  if (vencidos.length > 0) {
    issues.push({
      severity: "alta",
      label: "Vencidos",
      count: vencidos.length,
      items: vencidos.slice(0, 3).map((s) => s.nombre),
    });
  }
  if (venciendo.length > 0) {
    issues.push({
      severity: "media",
      label: "Vencen en <45 días",
      count: venciendo.length,
      items: venciendo.slice(0, 3).map((s) => s.nombre),
    });
  }
  if (condicionados > 0) {
    issues.push({
      severity: "media",
      label: "Condicionados",
      count: condicionados,
      items: supplies.filter((s) => (s.estadoTecnico || s.estado) === "condicionado").slice(0, 3).map((s) => s.nombre),
    });
  }
  if (rechazados > 0) {
    issues.push({
      severity: "alta",
      label: "Rechazados",
      count: rechazados,
      items: supplies.filter((s) => (s.estadoTecnico || s.estado) === "rechazado").slice(0, 3).map((s) => s.nombre),
    });
  }
  if (sinDocs.length > 0) {
    issues.push({
      severity: "baja",
      label: "Sin documentación completa",
      count: sinDocs.length,
      items: sinDocs.slice(0, 3).map((s) => s.nombre),
    });
  }

  return {
    issues,
    healthScore,
    summary: { total, aprobados, condicionados, rechazados, venciendo: venciendo.length, vencidos: vencidos.length },
  };
}

export function predictCompliance(records) {
  if (records.length < 2) return { predicted: 80, confidence: 25, trend: "insuficiente" };

  const sorted = [...records].sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
  const recent = sorted.slice(-Math.min(6, sorted.length));
  const conformesPct = (recent.filter((r) => r.resultado === "conforme").length / recent.length) * 100;

  let trend = "estable";
  if (sorted.length >= 4) {
    const third = Math.floor(sorted.length / 3);
    const firstConf = sorted.slice(0, third).filter((r) => r.resultado === "conforme").length / third;
    const lastConf = sorted.slice(-third).filter((r) => r.resultado === "conforme").length / third;
    if (lastConf > firstConf + 0.15) trend = "mejorando";
    else if (lastConf < firstConf - 0.15) trend = "empeorando";
  }

  let predicted = Math.round(conformesPct);
  if (trend === "mejorando") predicted = Math.min(100, predicted + 7);
  if (trend === "empeorando") predicted = Math.max(0, predicted - 7);

  const confidence = Math.min(90, 35 + records.length * 7);

  return { predicted, confidence, trend };
}
