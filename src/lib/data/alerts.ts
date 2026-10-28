import { kpisLogistica, nivelRioParaguayM, seriePrecios } from "./operaciones";
import { operadoresDetalle } from "./operadores";
import { FILTROS_POR_DEFECTO, porDepartamento, resumen } from "./query";
import { estaciones, vaciosDeCobertura } from "./red";
import { redondear } from "./random";

export type Severidad = "alta" | "media" | "baja";
export type Area = "Comercial" | "Logística" | "Mercado" | "Red";

export type Alerta = {
  id: string;
  severidad: Severidad;
  area: Area;
  titulo: string;
  detalle: string;
  /** Pregunta sugerida para profundizar con Arandu. */
  pregunta: string;
  enlace: string;
};

const peso: Record<Severidad, number> = { alta: 0, media: 1, baja: 2 };

export function detectarAlertas(): Alerta[] {
  const out: Alerta[] = [];

  for (const o of operadoresDetalle) {
    if (o.cumplimientoPct < 96)
      out.push({
        id: `op-meta-${o.operador}`,
        severidad: o.cumplimientoPct < 93 ? "alta" : "media",
        area: "Comercial",
        titulo: `${o.operador} al ${o.cumplimientoPct}% de su meta`,
        detalle: `Brecha de ${Math.abs(o.brechaMl).toFixed(1)} ML contra la meta de ${o.metaMl.toFixed(1)} ML; crecimiento de ${o.crecimientoPct}%.`,
        pregunta: `Analiza la brecha de ${o.operador} y propone acciones con su impacto en ML.`,
        enlace: "/operadores",
      });
    const desvio = ((o.ejecutadoMUSD - o.presupuestoMUSD) / o.presupuestoMUSD) * 100;
    if (desvio > 2.5)
      out.push({
        id: `op-ppto-${o.operador}`,
        severidad: desvio > 4 ? "alta" : "media",
        area: "Comercial",
        titulo: `${o.operador} gasta ${redondear(desvio, 1)}% sobre presupuesto`,
        detalle: `USD ${o.ejecutadoMUSD} M ejecutados vs. USD ${o.presupuestoMUSD} M presupuestados en costos comerciales.`,
        pregunta: "Compara presupuesto y ejecución por operador y prioriza los desvíos.",
        enlace: "/comercial?tab=presupuesto",
      });
  }

  const deptos = porDepartamento(FILTROS_POR_DEFECTO).filter(
    (d) => d.cumplimientoPct !== null && d.cumplimientoPct < 95,
  );
  for (const d of deptos.slice(0, 3))
    out.push({
      id: `depto-${d.depto}`,
      severidad: (d.cumplimientoPct ?? 100) < 92 ? "alta" : "media",
      area: "Comercial",
      titulo: `${d.depto} al ${d.cumplimientoPct}% de la meta`,
      detalle: `Faltan ${Math.abs(d.brecha ?? 0).toFixed(1)} ML para la meta Ene–Sep 2026.`,
      pregunta: `¿Por qué ${d.depto} está bajo meta y qué haría para cerrar la brecha?`,
      enlace: `/comercial?tab=territorio&depto=${encodeURIComponent(d.depto)}`,
    });

  if (kpisLogistica.stockDiasDiesel < 20)
    out.push({
      id: "stock-diesel",
      severidad: kpisLogistica.stockDiasDiesel < 15 ? "alta" : "media",
      area: "Logística",
      titulo: `Stock de diésel en ${kpisLogistica.stockDiasDiesel} días`,
      detalle: "Por debajo del umbral de 20 días de cobertura definido para la demo.",
      pregunta: "¿Cuántos días de stock tenemos y qué riesgo hay?",
      enlace: "/logistica",
    });

  if (nivelRioParaguayM < 1)
    out.push({
      id: "rio",
      severidad: "alta",
      area: "Logística",
      titulo: `Río Paraguay en ${nivelRioParaguayM} m`,
      detalle:
        "Bajante: las importaciones fluviales cayeron y sube la dependencia del transporte terrestre.",
      pregunta: "¿Qué riesgos plantea el nivel del río?",
      enlace: "/logistica",
    });

  const ultimo = seriePrecios[seriePrecios.length - 1];
  if (ultimo) {
    const brecha = ((ultimo.mercadoDiesel - ultimo.petroparDiesel) / ultimo.mercadoDiesel) * 100;
    out.push({
      id: "precio",
      severidad: "baja",
      area: "Mercado",
      titulo: `Diésel Petropar ${redondear(brecha, 1)}% bajo el mercado`,
      detalle: `Gs ${ultimo.petroparDiesel.toLocaleString("es-PY")} vs. Gs ${ultimo.mercadoDiesel.toLocaleString("es-PY")} por litro; Brent en USD ${ultimo.brent}.`,
      pregunta: "Compara nuestro precio de diésel con el mercado",
      enlace: "/mercado",
    });
  }

  const bajoPotencial = estaciones.filter((e) => e.aprovechamientoPct < 60);
  if (bajoPotencial.length)
    out.push({
      id: "estaciones-potencial",
      severidad: "media",
      area: "Red",
      titulo: `${bajoPotencial.length} estaciones bajo el 60% de su potencial`,
      detalle: `Potencial no capturado: ${redondear(
        bajoPotencial.reduce((s, e) => s + e.potencialMl - e.ventasMl, 0),
        1,
      )} ML en Ene–Sep 2026.`,
      pregunta: "¿Qué estaciones están más lejos de su potencial y por qué?",
      enlace: "/soluciones/estaciones",
    });

  const vacios = vaciosDeCobertura();
  if (vacios.length)
    out.push({
      id: "vacios",
      severidad: "baja",
      area: "Red",
      titulo: `${vacios.length} ciudades con competencia y sin Petropar cerca`,
      detalle: `Principales: ${vacios
        .slice(0, 3)
        .map((v) => v.nombre)
        .join(", ")}.`,
      pregunta: "¿Dónde hay vacíos de cobertura frente a la competencia?",
      enlace: "/soluciones/competencia",
    });

  const ytd = resumen(FILTROS_POR_DEFECTO);
  if (ytd.cumplimientoPct !== null && ytd.cumplimientoPct < 100)
    out.push({
      id: "meta-nacional",
      severidad: ytd.cumplimientoPct < 95 ? "alta" : "media",
      area: "Comercial",
      titulo: `Líquidos al ${ytd.cumplimientoPct}% de la meta acumulada`,
      detalle: `${ytd.actual.toLocaleString("es-PY")} ML vs. meta de ${ytd.meta?.toLocaleString("es-PY")} ML (Ene–Sep 2026).`,
      pregunta: "¿Cuál es la brecha acumulada contra la meta?",
      enlace: "/comercial?tab=metas",
    });

  return out.sort((a, b) => peso[a.severidad] - peso[b.severidad]);
}
