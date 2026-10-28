export const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export const PRIMER_PERIODO = "2025-01";
export const ULTIMO_PERIODO = "2026-09";

export const anioDe = (p: string) => Number(p.slice(0, 4));
export const mesDe = (p: string) => Number(p.slice(5, 7));

export function desplazar(p: string, meses: number): string {
  const total = anioDe(p) * 12 + mesDe(p) - 1 + meses;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export function rango(desde: string, hasta: string): string[] {
  const out: string[] = [];
  for (let p = desde; p <= hasta; p = desplazar(p, 1)) out.push(p);
  return out;
}

/** Todos los meses con datos reales de la demo (Ene 2025 – Sep 2026). */
export const periodos = rango(PRIMER_PERIODO, ULTIMO_PERIODO);

export const etiquetaPeriodo = (p: string) => `${MESES[mesDe(p) - 1]} ${anioDe(p)}`;
export const etiquetaCorta = (p: string) => `${MESES[mesDe(p) - 1]} ${String(anioDe(p)).slice(2)}`;

export function etiquetaRango(desde: string, hasta: string) {
  if (desde === hasta) return etiquetaPeriodo(desde);
  if (anioDe(desde) === anioDe(hasta))
    return `${MESES[mesDe(desde) - 1]}–${etiquetaPeriodo(hasta)}`;
  return `${etiquetaPeriodo(desde)} – ${etiquetaPeriodo(hasta)}`;
}

export const presetsPeriodo = [
  { id: "ytd", label: "Ene–Sep 2026", desde: "2026-01", hasta: "2026-09" },
  { id: "t3", label: "3er trimestre 2026", desde: "2026-07", hasta: "2026-09" },
  { id: "u12", label: "Últimos 12 meses", desde: "2025-10", hasta: "2026-09" },
  { id: "a2025", label: "Año 2025", desde: "2025-01", hasta: "2025-12" },
  { id: "todo", label: "Ene 2025 – Sep 2026", desde: PRIMER_PERIODO, hasta: ULTIMO_PERIODO },
] as const;
