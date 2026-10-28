import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MessageSquareText, Printer } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { FilterBar } from "@/components/filters/FilterBar";
import { Territorio } from "@/components/comercial/Territorio";
import {
  Estadistica,
  Forecast,
  Metas,
  Operadores,
  Presupuesto,
  Resumen,
} from "@/components/comercial/Pestanas";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { etiquetaRango } from "@/lib/data";
import { aFiltrosVentas, validarFiltrosUrl, type FiltrosUrl } from "@/lib/filtros-url";

const pestanas = [
  { id: "resumen", label: "Resumen" },
  { id: "territorio", label: "Territorio" },
  { id: "operadores", label: "Operadores" },
  { id: "metas", label: "Metas vs. realizado" },
  { id: "presupuesto", label: "Presupuesto" },
  { id: "forecast", label: "Forecast" },
  { id: "estadistica", label: "Estadística" },
] as const;
type Pestana = (typeof pestanas)[number]["id"];

export const Route = createFileRoute("/comercial")({
  validateSearch: (search: Record<string, unknown>): FiltrosUrl & { tab?: Pestana } => {
    const tab = pestanas.find((p) => p.id === search["tab"])?.id;
    return { ...validarFiltrosUrl(search), ...(tab && tab !== "resumen" ? { tab } : {}) };
  },
  head: () => ({
    meta: [
      { title: "Análisis Comercial · Petropar" },
      {
        name: "description",
        content:
          "Ventas territoriales, operadores, metas, presupuestos, proyecciones y estadística comercial de Petropar.",
      },
      { property: "og:title", content: "Análisis Comercial · Petropar" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const filtros = aFiltrosVentas(search);
  const tab = search.tab ?? "resumen";
  const conFiltros = tab === "resumen" || tab === "territorio" || tab === "metas";

  return (
    <main className="pb-10">
      <PageHeader
        eyebrow="Inteligencia comercial"
        title="Reportes Comerciales"
        desc="Ventas, desempeño territorial, metas, presupuesto y decisiones para el cierre del año."
        periodo={etiquetaRango(filtros.desde, filtros.hasta)}
        acciones={
          <>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer /> PDF
            </Button>
            <Button asChild>
              <Link to="/chat">
                <MessageSquareText /> Consultar a Arandu
              </Link>
            </Button>
          </>
        }
      />
      <div className="space-y-6 px-6 md:px-10">
        <Tabs
          value={tab}
          onValueChange={(v) =>
            void navigate({
              to: ".",
              search: (prev: Record<string, unknown>) => ({
                ...prev,
                tab: v === "resumen" ? undefined : v,
              }),
              replace: true,
            } as never)
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="overflow-x-auto pb-1">
              <TabsList className="w-max">
                {pestanas.map((p) => (
                  <TabsTrigger key={p.id} value={p.id}>
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {conFiltros && (
              <FilterBar
                filtros={search}
                mostrar={tab === "metas" ? ["depto"] : ["periodo", "producto", "depto"]}
              />
            )}
          </div>
          <TabsContent value="resumen" className="mt-6">
            <Resumen filtros={filtros} />
          </TabsContent>
          <TabsContent value="territorio" className="mt-6">
            <Territorio filtros={filtros} />
          </TabsContent>
          <TabsContent value="operadores" className="mt-6">
            <Operadores />
          </TabsContent>
          <TabsContent value="metas" className="mt-6">
            <Metas filtros={filtros} />
          </TabsContent>
          <TabsContent value="presupuesto" className="mt-6">
            <Presupuesto />
          </TabsContent>
          <TabsContent value="forecast" className="mt-6">
            <Forecast />
          </TabsContent>
          <TabsContent value="estadistica" className="mt-6">
            <Estadistica />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
