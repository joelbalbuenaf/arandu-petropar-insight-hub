import { Fuel, MapPin, Radar, Building2, Database, ArrowUpRight, Check, Plug } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const soluciones = [
  {
    title: "Petropar y sus estaciones",
    icon: Fuel,
    category: "Desempeño de la red",
    description:
      "Comparar el volumen real con el potencial del entorno y detectar estaciones con oportunidades de crecimiento.",
    outputs: [
      "Mapa de desempeño por estación",
      "Volumen real vs. potencial de la zona",
      "Estaciones por debajo de su potencial",
    ],
    needs:
      "Para producción: ubicación real de las estaciones, ventas por estación y datos de demanda del entorno. La demo usa 158 estaciones ficticias.",
    status: "Demo navegable · requiere datos por estación",
    to: "/soluciones/estaciones",
  },
  {
    title: "Evaluador de sitios",
    icon: MapPin,
    category: "Expansión territorial",
    description:
      "Estimar el potencial de una nueva estación o punto Ñande Gas a partir de una dirección y su entorno.",
    outputs: [
      "Evaluación de una dirección candidata",
      "Tráfico, demografía y competidores cercanos",
      "Demanda proyectada y comparación de sitios",
    ],
    needs:
      "Para producción: datos de tráfico, demografía, competidores y un modelo de demanda validado. La demo usa un puntaje ilustrativo con factores explícitos.",
    status: "Demo navegable · modelo ilustrativo",
    to: "/soluciones/evaluador",
  },
  {
    title: "Radar de competencia",
    icon: Radar,
    category: "Inteligencia de mercado",
    description:
      "Identificar estaciones de emblemas privados, su densidad por zona y vacíos de cobertura para Petropar.",
    outputs: [
      "Mapa de estaciones competidoras",
      "Densidad por emblema y zona",
      "Zonas sin presencia de Petropar",
    ],
    needs:
      "Para producción: un registro geolocalizado y actualizado de estaciones de Petropar y de los emblemas privados. La demo usa 298 estaciones ficticias.",
    status: "Demo navegable · requiere registro de competencia",
    to: "/soluciones/competencia",
  },
  {
    title: "Radar de clientes B2B",
    icon: Building2,
    category: "Oportunidades comerciales",
    description:
      "Localizar transportistas, flotas, agro, constructoras y cooperativas para convenios de flota o suministro directo.",
    outputs: [
      "Prospectos por sector y ubicación",
      "Cruce con estaciones Petropar cercanas",
      "Priorización para convenios y suministro",
    ],
    needs:
      "Para producción: un directorio autorizado de empresas y sus ubicaciones. La demo usa 120 empresas ficticias.",
    status: "Demo navegable · requiere directorio de empresas",
    to: "/soluciones/b2b",
  },
  {
    title: "Consulta sobre SAP",
    icon: Database,
    category: "Conversación con datos",
    description:
      "Preguntar sobre ventas, clientes B2B, operadores y créditos, con una lectura propia del negocio: litros, cobertura y mermas.",
    outputs: [
      "Consultas en lenguaje natural",
      "Respuestas con contexto de combustibles",
      "Análisis de ventas, clientes, operadores y créditos",
    ],
    needs:
      "Conexión autorizada a SAP, permisos de acceso y definiciones de negocio. Arandu está disponible con datos ficticios; no consulta SAP ni créditos reales.",
    status: "Demo navegable · SAP no conectado",
    to: "/soluciones/sap",
  },
] as const;

export function HubSolutions() {
  return (
    <section aria-labelledby="solutions-title" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-chart-4 dark:text-sidebar-primary">
            Inteligencia para decidir
          </p>
          <h2 id="solutions-title" className="mt-1 text-2xl font-bold">
            Soluciones Petropar
          </h2>
        </div>
        <span className="text-sm text-muted-foreground">
          5 módulos navegables · datos ficticios
        </span>
      </div>
      <div className="grid gap-4 [grid-auto-rows:1fr] md:grid-cols-2 xl:grid-cols-3">
        {soluciones.map((solution) => {
          const Icon = solution.icon;
          return (
            <article
              key={solution.title}
              className="flex h-full min-w-0 flex-col rounded-lg border bg-card p-5 shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="text-right text-xs text-muted-foreground">
                  {solution.category}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{solution.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {solution.description}
              </p>
              <div className="mt-auto pt-5">
                <p className="mb-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <Plug className="size-3.5 shrink-0" />
                  {solution.status}
                </p>
                <div className="flex gap-2">
                  <Button asChild className="flex-1 justify-between">
                    <Link to={solution.to as never}>
                      Abrir módulo <ArrowUpRight className="size-4" />
                    </Link>
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">Detalle</Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg">
                      <DialogHeader>
                        <DialogTitle className="pr-5 leading-snug">{solution.title}</DialogTitle>
                        <DialogDescription className="pt-2 leading-relaxed">
                          {solution.description}
                        </DialogDescription>
                      </DialogHeader>
                      <div>
                        <h4 className="text-sm font-semibold">Análisis incluidos en la demo</h4>
                        <ul className="mt-3 space-y-3 text-sm">
                          {solution.outputs.map((output) => (
                            <li key={output} className="flex items-start gap-2">
                              <Check className="mt-0.5 size-4 shrink-0 text-success" />
                              {output}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold">Datos y conexiones necesarios</h4>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {solution.needs}
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
