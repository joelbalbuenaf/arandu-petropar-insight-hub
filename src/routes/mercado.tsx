import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Kpi, PageHeader } from "@/components/AppShell";
import { Grafico } from "@/components/AnalyticalChart";
import { BotonCsv, Seccion, Tabla } from "@/components/comercial/comun";
import { FilterBar } from "@/components/filters/FilterBar";
import {
  competencia,
  estaciones,
  etiquetaRango,
  participacionMercado,
  seriePrecios,
  vaciosDeCobertura,
} from "@/lib/data";
import { fmtNumero } from "@/lib/export";
import { aFiltrosVentas, validarFiltrosUrl } from "@/lib/filtros-url";

export const Route = createFileRoute("/mercado")({
  validateSearch: validarFiltrosUrl,
  head: () => ({
    meta: [
      { title: "Reportes Mercado · Petropar" },
      {
        name: "description",
        content: "Participación de mercado, precios y competencia en Paraguay.",
      },
      { property: "og:title", content: "Reportes Mercado · Petropar" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  const f = aFiltrosVentas(search);
  const precios = seriePrecios.filter((p) => p.periodo >= f.desde && p.periodo <= f.hasta);
  const ultimo = seriePrecios[seriePrecios.length - 1];
  const inicio = precios[0];
  const brecha = ultimo
    ? ((ultimo.mercadoDiesel - ultimo.petroparDiesel) / ultimo.mercadoDiesel) * 100
    : 0;
  const vacios = vaciosDeCobertura();

  return (
    <main className="pb-10">
      <PageHeader
        eyebrow="Reportes"
        title="Reportes Mercado"
        desc="Participación de mercado, precios frente a la competencia y referencia Brent."
        periodo={etiquetaRango(f.desde, f.hasta)}
        acciones={<FilterBar filtros={search} mostrar={["periodo"]} />}
      />
      <div className="space-y-6 px-6 md:px-10">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Participación Petropar"
            value={`${participacionMercado[0]?.pct ?? 0}%`}
            hint="Líder del mercado"
          />
          <Kpi
            label="Diésel Petropar"
            value={`Gs ${fmtNumero(ultimo?.petroparDiesel, 0)}`}
            hint={`${fmtNumero(brecha)}% bajo el promedio de mercado`}
          />
          <Kpi
            label="Brent"
            value={`USD ${fmtNumero(ultimo?.brent)}`}
            delta={inicio && ultimo ? ((ultimo.brent - inicio.brent) / inicio.brent) * 100 : null}
            deltaLabel="en el período"
            invertir
          />
          <Kpi
            label="Estaciones de la competencia"
            value={fmtNumero(competencia.length, 0)}
            hint={`vs. ${estaciones.length} de la red Petropar (demo)`}
          />
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Seccion titulo="Participación de mercado">
            <Grafico grafico="participacion" />
          </Seccion>
          <Seccion titulo="Precio del diésel vs. mercado">
            <Grafico grafico="precios" desde={f.desde} hasta={f.hasta} />
          </Seccion>
          <Seccion titulo="Competencia por emblema">
            <Grafico grafico="competencia_emblemas" />
          </Seccion>
          <Seccion
            titulo="Vacíos de cobertura"
            acciones={
              <div className="flex gap-2">
                <BotonCsv filas={vacios} nombre="vacios-de-cobertura" />
                <Link
                  to="/soluciones/competencia"
                  className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                >
                  Radar <ArrowRight className="size-3" />
                </Link>
              </div>
            }
          >
            <p className="mb-3 text-sm text-muted-foreground">
              Ciudades con 2 o más competidores a 6 km y ninguna estación Petropar a menos de 10 km.
            </p>
            <Tabla
              filas={vacios}
              clave={(v) => v.nombre}
              columnas={[
                { titulo: "Ciudad", valor: (v) => v.nombre },
                { titulo: "Departamento", valor: (v) => v.depto },
                { titulo: "Competidores", valor: (v) => v.competidores, numero: true },
                {
                  titulo: "Petropar más cercana",
                  valor: (v) => `${fmtNumero(v.estacionPropiaKm)} km`,
                  numero: true,
                },
              ]}
            />
          </Seccion>
        </div>
      </div>
    </main>
  );
}
