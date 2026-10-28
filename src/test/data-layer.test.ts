import { describe, expect, it } from "vitest";
import {
  competencia,
  detectarAlertas,
  estaciones,
  evaluarSitio,
  FILTROS_POR_DEFECTO,
  hechosVentas,
  normalizarFiltros,
  operadores,
  porDepartamento,
  prospectos,
  proyectar,
  resumen,
  serieNacional,
  volumen,
} from "@/lib/data";

describe("capa de datos de demo", () => {
  it("los departamentos suman exactamente la serie nacional", () => {
    for (const periodo of ["2025-03", "2026-09"]) {
      const suma = hechosVentas
        .filter((h) => h.periodo === periodo && h.producto === "diesel")
        .reduce((s, h) => s + h.valor, 0);
      expect(suma).toBeCloseTo(serieNacional.diesel[periodo] ?? 0, 2);
    }
    expect(volumen(FILTROS_POR_DEFECTO)).toBe(1904);
  });

  it("nunca suma GLP con combustibles líquidos", () => {
    const liquidos = volumen(FILTROS_POR_DEFECTO);
    const glp = volumen({ ...FILTROS_POR_DEFECTO, producto: "glp" });
    expect(resumen(FILTROS_POR_DEFECTO).unidad).toBe("ML");
    expect(resumen({ ...FILTROS_POR_DEFECTO, producto: "glp" }).unidad).toBe("kt");
    expect(liquidos).toBe(1217 + 590 + 97);
    expect(glp).toBe(226);
  });

  it("calcula variación interanual y cumplimiento", () => {
    const r = resumen(FILTROS_POR_DEFECTO);
    expect(r.interanual).not.toBeNull();
    expect(r.meta).toBe(1977);
    expect(r.cumplimientoPct).toBeCloseTo((1904 / 1977) * 100, 1);
    const deptos = porDepartamento(FILTROS_POR_DEFECTO);
    expect(deptos).toHaveLength(18);
    expect(deptos.reduce((s, d) => s + d.valor, 0)).toBeCloseTo(1904, 1);
  });

  it("normaliza filtros inválidos", () => {
    expect(
      normalizarFiltros({ desde: "2030-01", producto: "kerosene" as never, depto: "Narnia" }),
    ).toEqual(FILTROS_POR_DEFECTO);
    expect(normalizarFiltros({ desde: "2026-09", hasta: "2026-01" })).toMatchObject({
      desde: "2026-01",
      hasta: "2026-09",
    });
  });

  it("las estaciones de cada red suman el volumen de su operador", () => {
    for (const op of operadores.filter((o) => o.estaciones > 0)) {
      const red = estaciones.filter((e) => e.operador === op.operador);
      expect(red).toHaveLength(op.estaciones);
      expect(red.reduce((s, e) => s + e.ventasMl, 0)).toBeCloseTo(op.litrosMl, 1);
    }
    expect(competencia.length).toBeGreaterThan(200);
    expect(prospectos.length).toBe(120);
  });

  it("es determinística", async () => {
    const otra = await import("@/lib/data/red");
    expect(otra.estaciones[0]).toEqual(estaciones[0]);
  });

  it("proyecta con backtest y escenario", () => {
    const p = proyectar("total", 10);
    expect(p.meses).toHaveLength(3);
    expect(p.mapePct).toBeLessThan(10);
    expect(p.totalEscenario).toBeCloseTo(p.totalBase * 1.1, 0);
  });

  it("detecta alertas ordenadas por severidad", () => {
    const alertas = detectarAlertas();
    expect(alertas.length).toBeGreaterThan(3);
    expect(alertas[0]?.severidad).toBe("alta");
    expect(alertas.some((a) => a.titulo.includes("Distribuidores Mayoristas"))).toBe(true);
  });

  it("evalúa un sitio con factores explicados", () => {
    const e = evaluarSitio({ lat: -25.36, lng: -57.43 });
    expect(e.puntaje).toBeGreaterThanOrEqual(0);
    expect(e.puntaje).toBeLessThanOrEqual(100);
    expect(e.factores).toHaveLength(4);
  });
});

describe("estadística", () => {
  it("correlación de Pearson e intervalo de predicción", async () => {
    const { correlacion, competenciaVsAprovechamiento, mesesAtipicos } = await import("@/lib/data");
    expect(correlacion([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 5);
    expect(correlacion([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 5);
    const c = competenciaVsAprovechamiento();
    expect(c.r).toBeLessThan(0); // más competencia, menos aprovechamiento
    expect(Array.isArray(mesesAtipicos())).toBe(true);
    const m = proyectar("total").meses[0];
    expect(m && m.minimo < m.base && m.base < m.maximo).toBe(true);
  });
});
