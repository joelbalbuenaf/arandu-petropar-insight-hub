import { useMemo } from "react";
import { ChartView } from "@/components/charts/ChartView";
import { construirGrafico, graficoLegado, type ParametrosGrafico } from "@/lib/charts";
import type { ProductoLiquido } from "@/lib/data";

/** Gráfico del catálogo por parámetros (dashboards). */
export function Grafico({ alto, ...p }: ParametrosGrafico & { alto?: number }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const spec = useMemo(() => construirGrafico(p), [JSON.stringify(p)]);
  return <ChartView spec={spec} {...(alto ? { alto } : {})} />;
}

/** Compatibilidad con los marcadores del prototipo ([[grafico:id]]). */
export function AnalyticalChart({
  id,
  forecastProduct = "total",
  adjustment = 0,
}: {
  id: string;
  forecastProduct?: ProductoLiquido | "total";
  adjustment?: number;
}) {
  const spec = useMemo(
    () =>
      id === "forecast"
        ? construirGrafico({
            grafico: "forecast",
            producto: forecastProduct,
            ajuste_pct: adjustment,
          })
        : graficoLegado(id),
    [id, forecastProduct, adjustment],
  );
  return spec ? <ChartView spec={spec} /> : null;
}
