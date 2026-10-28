import { createFileRoute } from "@tanstack/react-router";
import { Kpi, PageHeader } from "@/components/AppShell";
import { Grafico } from "@/components/AnalyticalChart";
import { BotonCsv, Seccion, Tabla } from "@/components/comercial/comun";
import { FilterBar } from "@/components/filters/FilterBar";
import { HubMap } from "@/components/map/HubMap";
import {
  etiquetaRango,
  kpisLogistica,
  nivelRioParaguayM,
  plantas,
  serieLogistica,
} from "@/lib/data";
import { fmtNumero } from "@/lib/export";
import { aFiltrosVentas, validarFiltrosUrl } from "@/lib/filtros-url";

export const Route = createFileRoute("/logistica")({
  validateSearch: validarFiltrosUrl,
  head: () => ({
    meta: [
      { title: "Reportes Logística · Petropar" },
      {
        name: "description",
        content: "Stock por planta, importaciones, nivel del río y entregas de Petropar.",
      },
      { property: "og:title", content: "Reportes Logística · Petropar" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  const f = aFiltrosVentas(search);
  const k = kpisLogistica;
  const meses = serieLogistica.filter((s) => s.periodo >= f.desde && s.periodo <= f.hasta);
  const fluvial = meses.reduce((s, m) => s + m.fluvial, 0);
  const terrestre = meses.reduce((s, m) => s + m.terrestre, 0);
  const filasPlantas = plantas.map((p) => ({
    ...p,
    ocupacionPct: (p.stockM3 / p.capacidadM3) * 100,
  }));

  return (
    <main className="pb-10">
      <PageHeader
        eyebrow="Reportes"
        title="Reportes Logística"
        desc="Almacenamiento, plantas, importaciones fluviales y terrestres, y riesgo del río Paraguay."
        periodo={etiquetaRango(f.desde, f.hasta)}
        acciones={<FilterBar filtros={search} mostrar={["periodo"]} />}
      />
      <div className="space-y-6 px-6 md:px-10">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Stock diésel"
            value={`${k.stockDiasDiesel} días`}
            hint="Umbral de la demo: 20 días"
          />
          <Kpi label="Stock naftas" value={`${k.stockDiasNaftas} días`} />
          <Kpi
            label="Río Paraguay (Asunción)"
            value={`${fmtNumero(nivelRioParaguayM, 2)} m`}
            hint="Bajante: limita barcazas"
          />
          <Kpi
            label="Importación terrestre"
            value={`${fmtNumero((terrestre / (fluvial + terrestre)) * 100)}%`}
            hint={`${fmtNumero(fluvial + terrestre, 0)} mil m³ en el período`}
          />
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Seccion titulo="Importaciones por modo">
            <Grafico grafico="importaciones" desde={f.desde} hasta={f.hasta} />
          </Seccion>
          <Seccion titulo="Nivel del río Paraguay">
            <Grafico grafico="nivel_rio" />
          </Seccion>
          <Seccion titulo="Capacidad y stock por planta">
            <Grafico grafico="stock_plantas" />
          </Seccion>
          <Seccion titulo="Plantas" acciones={<BotonCsv filas={filasPlantas} nombre="plantas" />}>
            <HubMap
              alto={230}
              capas={[
                {
                  id: "plantas",
                  nombre: "Plantas Petropar",
                  color: "var(--series-1)",
                  radio: [7, 14],
                  puntos: plantas.map((p) => ({
                    id: p.planta,
                    lat: p.lat,
                    lng: p.lng,
                    titulo: p.planta,
                    valor: p.capacidadM3,
                    detalle: `${p.producto} · ${fmtNumero(p.stockM3, 0)} / ${fmtNumero(p.capacidadM3, 0)} m³`,
                  })),
                },
              ]}
            />
            <div className="mt-4">
              <Tabla
                filas={filasPlantas}
                clave={(p) => p.planta}
                columnas={[
                  { titulo: "Planta", valor: (p) => p.planta },
                  { titulo: "Stock m³", valor: (p) => fmtNumero(p.stockM3, 0), numero: true },
                  {
                    titulo: "Capacidad m³",
                    valor: (p) => fmtNumero(p.capacidadM3, 0),
                    numero: true,
                  },
                  {
                    titulo: "Ocupación",
                    valor: (p) => `${fmtNumero(p.ocupacionPct)}%`,
                    numero: true,
                  },
                ]}
              />
            </div>
          </Seccion>
        </div>
      </div>
    </main>
  );
}
